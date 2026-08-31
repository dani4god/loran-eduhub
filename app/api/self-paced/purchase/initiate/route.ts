//api/self-paced/purchase/initiate/route.ts
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
  let createdUserId:
    | mongoose.Types.ObjectId
    | null = null

  let createdStudentId:
    | mongoose.Types.ObjectId
    | null = null

  try {
    let body: any

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request body',
        },
        {
          status: 400,
        }
      )
    }

    const firstName =
      typeof body?.firstName === 'string'
        ? body.firstName.trim()
        : ''

    const lastName =
      typeof body?.lastName === 'string'
        ? body.lastName.trim()
        : ''

    const email =
      typeof body?.email === 'string'
        ? body.email
            .trim()
            .toLowerCase()
        : ''

    const phone =
      typeof body?.phone === 'string'
        ? body.phone.trim()
        : ''

    const password =
      typeof body?.password === 'string'
        ? body.password
        : ''

    const courseId =
      typeof body?.courseId === 'string'
        ? body.courseId.trim()
        : ''

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !courseId
    ) {
      return NextResponse.json(
        {
          error:
            'All fields are required',
        },
        {
          status: 400,
        }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 8 characters',
        },
        {
          status: 400,
        }
      )
    }

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

    const course =
      await SelfPacedCourse.findOne({
        _id: courseId,
        status: 'published',
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

    let user =
      await User.findOne({
        email,
      })

    let student:
      | any
      | null = null

    if (user) {
      student =
        await SelfPacedStudent.findOne({
          userId: user._id,
        })

      if (!student) {
        return NextResponse.json(
          {
            error:
              'This email is already registered under a different account type',
          },
          {
            status: 400,
          }
        )
      }

      const existingEnrollment =
        await SelfPacedEnrollment.findOne({
          selfPacedStudentId:
            student._id,
          courseId,
        })

      if (existingEnrollment) {
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
    }

    // ========================================================
    // FREE COURSE
    // ========================================================

    if (
      Number(course.price || 0) === 0
    ) {
      if (!user) {
        user = await User.create({
          email,
          password,
          role:
            'selfpaced_student',
          isActive: true,
        })

        student =
          await SelfPacedStudent.create({
            userId: user._id,
            firstName,
            lastName,
            phone,
          })
      }

      if (!student) {
        return NextResponse.json(
          {
            error:
              'Unable to create student account',
          },
          {
            status: 500,
          }
        )
      }

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
        requiresPayment: false,
      })
    }

    // ========================================================
    // PAID COURSE
    // ========================================================

    if (!PAYSTACK_SECRET) {
      return NextResponse.json(
        {
          error:
            'Paystack is not configured on the server',
        },
        {
          status: 500,
        }
      )
    }

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

    /*
     * IMPORTANT:
     *
     * Create the account BEFORE Paystack so that we never
     * need to place the user's password inside Paystack
     * metadata.
     *
     * New paid accounts remain inactive until payment
     * verification succeeds.
     */

    if (!user) {
      user =
        await User.create({
          email,
          password,
          role:
            'selfpaced_student',
          isActive: false,
        })

      createdUserId =
        user._id

      student =
        await SelfPacedStudent.create({
          userId:
            user._id,
          firstName,
          lastName,
          phone,
        })

      createdStudentId =
        student._id
    }

    if (!student) {
      return NextResponse.json(
        {
          error:
            'Student account could not be prepared',
        },
        {
          status: 500,
        }
      )
    }

    const reference =
      `SP-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`

    const callbackUrl =
      `${baseUrl}/self-paced/${courseId}/purchase`

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
            email,

            amount:
              Math.round(
                Number(
                  course.price
                ) * 100
              ),

            currency:
              'NGN',

            reference,

            callback_url:
              callbackUrl,

            metadata: {
              type:
                'self_paced_purchase',

              courseId:
                course._id.toString(),

              selfPacedStudentId:
                student._id.toString(),

              userId:
                user._id.toString(),
            },
          }),
        }
      )

    const paystackData =
      await paystackRes.json()

    if (
      !paystackRes.ok ||
      !paystackData?.status ||
      !paystackData?.data
    ) {
      /*
       * If we created a brand-new account specifically for
       * this request and Paystack initialization failed,
       * clean it up.
       */

      if (
        createdStudentId
      ) {
        await SelfPacedStudent.deleteOne({
          _id:
            createdStudentId,
        }).catch(() => {})
      }

      if (createdUserId) {
        await User.deleteOne({
          _id:
            createdUserId,
        }).catch(() => {})
      }

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

      reference:
        paystackData.data
          .reference,

      authorizationUrl:
        paystackData.data
          .authorization_url,

      accessCode:
        paystackData.data
          .access_code,

      amount:
        Number(
          course.price
        ),

      email,
    })
  } catch (error: any) {
    console.error(
      'Self-paced purchase initiate error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to start purchase',
      },
      {
        status: 500,
      }
    )
  }
}