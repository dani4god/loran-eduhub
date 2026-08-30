import {
  NextRequest,
  NextResponse,
} from 'next/server'

import mongoose from 'mongoose'

import {
  getServerSession,
} from 'next-auth'

import {
  authOptions,
} from '@/lib/auth'

import connectDB from '@/lib/mongodb'

import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'

import {
  syncSelfPacedStudentDiscordRoles,
} from '@/lib/discordSync'

async function verifyWithPaystack(
  reference: string
) {
  const secret =
    process.env.PAYSTACK_SECRET_KEY

  if (!secret) {
    throw new Error(
      'Paystack is not configured'
    )
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      reference
    )}`,
    {
      headers: {
        Authorization:
          `Bearer ${secret}`,
      },

      cache:
        'no-store',
    }
  )

  const body =
    await res.json()

  return {
    ok: res.ok,
    body,
  }
}

export async function GET(
  req: NextRequest
) {
  try {
    const session =
      await getServerSession(
        authOptions
      )

    if (
      !session ||
      session.user.role !==
        'selfpaced_student'
    ) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const {
      searchParams,
    } = new URL(req.url)

    const reference =
      searchParams
        .get('reference')
        ?.trim()

    if (!reference) {
      return NextResponse.json(
        {
          error:
            'Reference is required',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    const student =
      await SelfPacedStudent.findOne({
        userId:
          session.user.id,
      })

    if (!student) {
      return NextResponse.json(
        {
          error:
            'Student not found',
        },
        {
          status: 404,
        }
      )
    }

    const {
      ok,
      body: verification,
    } =
      await verifyWithPaystack(
        reference
      )

    if (
      !ok ||
      !verification?.status ||
      verification?.data?.status !==
        'success'
    ) {
      return NextResponse.json(
        {
          error:
            `Payment not confirmed (status: ${
              verification?.data
                ?.status ??
              'unknown'
            })`,
        },
        {
          status: 400,
        }
      )
    }

    const transaction =
      verification.data

    const metadata =
      transaction.metadata || {}

    if (
      metadata.type !==
      'self_paced_addon'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid transaction type',
        },
        {
          status: 400,
        }
      )
    }

    if (
      metadata.selfPacedStudentId !==
      student._id.toString()
    ) {
      return NextResponse.json(
        {
          error:
            'This payment does not belong to your account',
        },
        {
          status: 403,
        }
      )
    }

    const courseId =
      String(
        metadata.courseId ||
          ''
      )

    if (
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid course metadata',
        },
        {
          status: 400,
        }
      )
    }

    const course =
      await SelfPacedCourse.findById(
        courseId
      )

    if (!course) {
      return NextResponse.json(
        {
          error:
            'Course not found',
        },
        {
          status: 404,
        }
      )
    }

    const expectedAmount =
      Math.round(
        Number(
          course.price
        ) * 100
      )

    if (
      Number(
        transaction.amount
      ) !== expectedAmount
    ) {
      return NextResponse.json(
        {
          error:
            'Payment amount mismatch',
        },
        {
          status: 400,
        }
      )
    }

    if (
      transaction.currency !==
      'NGN'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid payment currency',
        },
        {
          status: 400,
        }
      )
    }

    const existing =
      await SelfPacedEnrollment.findOne({
        selfPacedStudentId:
          student._id,

        courseId:
          course._id,
      })

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyProcessed:
          true,
      })
    }

    try {
      await SelfPacedEnrollment.create({
        selfPacedStudentId:
          student._id,

        courseId:
          course._id,

        tutorId:
          course.tutorId,

        amountPaid:
          Number(
            transaction.amount
          ) / 100,

        paystackReference:
          reference,

        weekProgress: [],
      })
    } catch (error: any) {
      if (
        error?.code ===
        11000
      ) {
        return NextResponse.json({
          success: true,
          alreadyProcessed:
            true,
        })
      }

      throw error
    }

    if (student.discordId) {
      await syncSelfPacedStudentDiscordRoles(
        student._id.toString(),
        student.discordId
      ).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed:
        false,
    })
  } catch (error: any) {
    console.error(
      'Quick purchase verification error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Verification failed',
      },
      {
        status: 500,
      }
    )
  }
}