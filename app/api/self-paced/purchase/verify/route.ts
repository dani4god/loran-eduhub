import {
  NextRequest,
  NextResponse,
} from 'next/server'

import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'

import User from '@/models/User'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'

import { syncSelfPacedStudentDiscordRoles } from '@/lib/discordSync'

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

  const data =
    await res.json()

  return {
    ok: res.ok,
    body: data,
  }
}

export async function GET(
  req: NextRequest
) {
  try {
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
          success: false,
          error:
            'Reference is required',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

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
      !verification?.data
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            verification?.message ||
            'Could not verify payment',
        },
        {
          status: 400,
        }
      )
    }

    const transaction =
      verification.data

    if (
      transaction.status !==
      'success'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Payment not confirmed (status: ${
              transaction.status ||
              'unknown'
            })`,
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
          success: false,
          error:
            'Invalid payment currency',
        },
        {
          status: 400,
        }
      )
    }

    const metadata =
      transaction.metadata || {}

    if (
      metadata.type !==
      'self_paced_purchase'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid transaction type',
        },
        {
          status: 400,
        }
      )
    }

    const courseId =
      String(
        metadata.courseId ||
          ''
      )

    const studentId =
      String(
        metadata.selfPacedStudentId ||
          ''
      )

    const userId =
      String(
        metadata.userId ||
          ''
      )

    if (
      !mongoose.Types.ObjectId.isValid(
        courseId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        studentId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid payment metadata',
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
          success: false,
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
      console.error(
        'Self-paced amount mismatch',
        {
          reference,
          expectedAmount,
          actualAmount:
            transaction.amount,
        }
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment amount mismatch',
        },
        {
          status: 400,
        }
      )
    }

    const student =
      await SelfPacedStudent.findOne({
        _id: studentId,
        userId,
      })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Student account not found',
        },
        {
          status: 404,
        }
      )
    }

    const user =
      await User.findById(
        userId
      )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            'User account not found',
        },
        {
          status: 404,
        }
      )
    }

    const transactionEmail =
      transaction?.customer?.email
        ?.toLowerCase()
        ?.trim()

    const userEmail =
      user.email
        ?.toLowerCase()
        ?.trim()

    if (
      transactionEmail &&
      userEmail &&
      transactionEmail !==
        userEmail
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment email does not match the student account',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Idempotency
    // --------------------------------------------------------

    const existing =
      await SelfPacedEnrollment.findOne({
        selfPacedStudentId:
          student._id,

        courseId:
          course._id,
      })

    if (existing) {
      if (!user.isActive) {
        user.isActive =
          true

        await user.save()
      }

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
      /*
       * Unique index:
       *
       * selfPacedStudentId + courseId
       */

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

    if (!user.isActive) {
      user.isActive =
        true

      await user.save()
    }

    if (student.discordId) {
      await syncSelfPacedStudentDiscordRoles(
        student._id.toString(),
        student.discordId
      ).catch((error) => {
        console.error(
          'Self-paced Discord sync failed:',
          error
        )
      })
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed:
        false,
    })
  } catch (error: any) {
    console.error(
      'Self-paced purchase verify error:',
      error
    )

    return NextResponse.json(
      {
        success: false,

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