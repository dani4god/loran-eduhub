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

import User from '@/models/User'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'

import {
  syncSelfPacedStudentDiscordRoles,
} from '@/lib/discordSync'

const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET_KEY

function getBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    ''
  ).replace(/\/$/, '')
}

export async function POST(
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

    const body =
      await req.json()

    const courseId =
      typeof body?.courseId ===
      'string'
        ? body.courseId.trim()
        : ''

    if (
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid course ID',
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

    const course =
      await SelfPacedCourse.findOne({
        _id: courseId,
        status:
          'published',
      })

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

    const existing =
      await SelfPacedEnrollment.findOne({
        selfPacedStudentId:
          student._id,

        courseId:
          course._id,
      })

    if (existing) {
      return NextResponse.json(
        {
          error:
            'You already own this course',
        },
        {
          status: 400,
        }
      )
    }

    if (
      Number(course.price) ===
      0
    ) {
      try {
        await SelfPacedEnrollment.create({
          selfPacedStudentId:
            student._id,

          courseId:
            course._id,

          tutorId:
            course.tutorId,

          amountPaid: 0,

          weekProgress: [],
        })
      } catch (error: any) {
        if (error?.code !== 11000) {
          throw error
        }
      }

      if (student.discordId) {
        await syncSelfPacedStudentDiscordRoles(
          student._id.toString(),
          student.discordId
        ).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        isFree: true,
        requiresPayment:
          false,
      })
    }

    if (!PAYSTACK_SECRET) {
      return NextResponse.json(
        {
          error:
            'Paystack is not configured',
        },
        {
          status: 500,
        }
      )
    }

    const user =
      await User.findById(
        session.user.id
      ).select('email')

    if (!user?.email) {
      return NextResponse.json(
        {
          error:
            'Account email not found',
        },
        {
          status: 400,
        }
      )
    }

    const reference =
      `SP-ADD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`

    const baseUrl =
      getBaseUrl()

    if (!baseUrl) {
      return NextResponse.json(
        {
          error:
            'Application URL is not configured',
        },
        {
          status: 500,
        }
      )
    }

    const paystackRes =
      await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${PAYSTACK_SECRET}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email:
              user.email,

            amount:
              Math.round(
                Number(
                  course.price
                ) * 100
              ),

            reference,

            currency:
              'NGN',

            callback_url:
              `${baseUrl}/dashboard/self-paced/purchase`,

            metadata: {
              type:
                'self_paced_addon',

              courseId:
                course._id.toString(),

              selfPacedStudentId:
                student._id.toString(),
            },
          }),
        }
      )

    const paystackData =
      await paystackRes.json()

    if (
      !paystackRes.ok ||
      !paystackData?.status
    ) {
      return NextResponse.json(
        {
          error:
            paystackData?.message ||
            'Paystack initialization failed',
        },
        {
          status: 502,
        }
      )
    }

    return NextResponse.json({
      success: true,

      isFree: false,

      requiresPayment:
        true,

      authorizationUrl:
        paystackData.data
          .authorization_url,

      accessCode:
        paystackData.data
          .access_code,

      reference:
        paystackData.data
          .reference,

      amount:
        Number(
          course.price
        ),

      email:
        user.email,
    })
  } catch (error: any) {
    console.error(
      'Self-paced quick purchase error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to initialize purchase',
      },
      {
        status: 500,
      }
    )
  }
}