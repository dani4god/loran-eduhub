// app/api/self-paced/booking/initiate/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getServerSession,
} from 'next-auth'

import mongoose from 'mongoose'

import {
  authOptions,
} from '@/lib/auth'

import connectDB from '@/lib/mongodb'
import { isLagosSlotInFuture } from '@/lib/lagosTime'

import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'
import CoachingBooking from '@/models/CoachingBooking'
import User from '@/models/User'

const HOLD_MINUTES = 15

function getBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    ''
  ).replace(/\/$/, '')
}

function createReference() {
  return (
    `COACH-${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()
  )
}

export async function POST(
  req: NextRequest
) {
  let claimedReference:
    | string
    | null = null

  let claimedSlotId:
    | string
    | null = null

  let bookingId:
    | string
    | null = null

  try {
    // ========================================================
    // AUTH
    // ========================================================

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

    // ========================================================
    // BODY
    // ========================================================

    let body: any

    try {
      body =
        await req.json()
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

    const courseId =
      typeof body?.courseId ===
      'string'
        ? body.courseId.trim()
        : ''

    const slotId =
      typeof body?.slotId ===
      'string'
        ? body.slotId.trim()
        : ''

    if (
      !courseId ||
      !slotId
    ) {
      return NextResponse.json(
        {
          error:
            'courseId and slotId are required',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        courseId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        slotId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid course or slot ID',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    // ========================================================
    // STUDENT
    // ========================================================

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

    // ========================================================
    // ENROLLMENT
    // ========================================================

    const enrollment =
      await SelfPacedEnrollment.findOne({
        selfPacedStudentId:
          student._id,

        courseId,
      }).select('_id')

    if (!enrollment) {
      return NextResponse.json(
        {
          error:
            'You must own this course to book coaching',
        },
        {
          status: 403,
        }
      )
    }

    // ========================================================
    // COURSE
    // ========================================================

    const course =
      await SelfPacedCourse.findOne({
        _id: courseId,
        status: 'published',
      })

    if (
      !course ||
      !course.coachingEnabled
    ) {
      return NextResponse.json(
        {
          error:
            'Coaching is not available for this course',
        },
        {
          status: 400,
        }
      )
    }

    const rate =
      Number(
        course.coachingHourlyRate ||
          0
      )

    if (
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid coaching rate',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // SLOT
    // ========================================================

    const slot =
      await TutorAvailabilitySlot.findById(
        slotId
      )

    if (!slot) {
      return NextResponse.json(
        {
          error:
            'Coaching slot not found',
        },
        {
          status: 404,
        }
      )
    }

    if (
      slot.courseId.toString() !==
      course._id.toString()
    ) {
      return NextResponse.json(
        {
          error:
            'This slot does not belong to this course',
        },
        {
          status: 400,
        }
      )
    }

    if (
      slot.tutorId.toString() !==
      course.tutorId.toString()
    ) {
      return NextResponse.json(
        {
          error:
            'This coaching slot does not belong to the course tutor',
        },
        {
          status: 400,
        }
      )
    }

    if (slot.isBooked) {
      return NextResponse.json(
        {
          error:
            'This coaching slot has already been booked',
        },
        {
          status: 409,
        }
      )
    }

    // ========================================================
    // LAGOS TIME VALIDATION
    // ========================================================

    if (
      !isLagosSlotInFuture(
        slot.date,
        slot.startTime
      )
    ) {
      return NextResponse.json(
        {
          error:
            'This coaching slot has already passed',
        },
        {
          status: 409,
        }
      )
    }

    // ========================================================
    // PAYSTACK CONFIG
    // ========================================================

    const PAYSTACK_SECRET =
      process.env.PAYSTACK_SECRET_KEY

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

    const user =
      await User.findById(
        session.user.id
      ).select('email')

    if (!user?.email) {
      return NextResponse.json(
        {
          error:
            'Student email not found',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // CREATE UNIQUE PAYMENT REFERENCE
    // ========================================================

    const reference =
      createReference()

    const now =
      new Date()

    const holdExpiresAt =
      new Date(
        now.getTime() +
          HOLD_MINUTES *
            60 *
            1000
      )

    // ========================================================
    // ATOMICALLY HOLD SLOT
    // ========================================================

    /*
     * This query means:
     *
     * - slot must not already be booked
     * - slot must belong to this course/tutor
     * - no active hold may currently exist
     *
     * If two students click simultaneously,
     * only one findOneAndUpdate can win.
     */

    const heldSlot =
      await TutorAvailabilitySlot.findOneAndUpdate(
        {
          _id: slot._id,

          courseId:
            course._id,

          tutorId:
            course.tutorId,

          isBooked:
            false,

          $or: [
            {
              holdExpiresAt: {
                $exists:
                  false,
              },
            },

            {
              holdExpiresAt:
                null,
            },

            {
              holdExpiresAt: {
                $lte: now,
              },
            },
          ],
        },
        {
          $set: {
            holdReference:
              reference,

            holdStudentId:
              student._id,

            holdExpiresAt,
          },
        },
        {
          new: true,
        }
      )

    if (!heldSlot) {
      return NextResponse.json(
        {
          error:
            'This coaching slot is currently reserved or has already been booked. Please choose another slot.',
        },
        {
          status: 409,
        }
      )
    }

    claimedReference =
      reference

    claimedSlotId =
      heldSlot._id.toString()

    // ========================================================
    // CREATE PENDING BOOKING
    // ========================================================

    let booking

    try {
      booking =
        await CoachingBooking.create({
          selfPacedStudentId:
            student._id,

          tutorId:
            course.tutorId,

          courseId:
            course._id,

          slotId:
            heldSlot._id,

          amountPaid:
            rate,

          paystackReference:
            reference,

          status:
            'pending_payment',
        })

      bookingId =
        booking._id.toString()
    } catch (error) {
      /*
       * Booking record failed.
       * Release only OUR hold.
       */

      await TutorAvailabilitySlot.updateOne(
        {
          _id:
            heldSlot._id,

          isBooked:
            false,

          holdReference:
            reference,
        },
        {
          $unset: {
            holdReference: '',
            holdStudentId: '',
            holdExpiresAt: '',
          },
        }
      ).catch(() => {})

      claimedReference =
        null

      claimedSlotId =
        null

      console.error(
        'Could not create coaching booking:',
        error
      )

      return NextResponse.json(
        {
          error:
            'Could not reserve this coaching slot',
        },
        {
          status: 500,
        }
      )
    }

    // ========================================================
    // INITIALIZE PAYSTACK
    // ========================================================

    let paystackRes: Response

    try {
      paystackRes =
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

            body:
              JSON.stringify({
                email:
                  user.email,

                amount:
                  Math.round(
                    rate * 100
                  ),

                reference,

                currency:
                  'NGN',

                callback_url:
                  `${baseUrl}/self-paced/booking/verify`,

                metadata: {
                  type:
                    'coaching_booking',

                  courseId:
                    course._id.toString(),

                  slotId:
                    heldSlot._id.toString(),

                  studentId:
                    student._id.toString(),

                  tutorId:
                    course.tutorId.toString(),
                },
              }),
          }
        )
    } catch (error) {
      // Paystack could not even be reached.

      await Promise.allSettled([
        TutorAvailabilitySlot.updateOne(
          {
            _id:
              heldSlot._id,

            isBooked:
              false,

            holdReference:
              reference,
          },
          {
            $unset: {
              holdReference: '',
              holdStudentId: '',
              holdExpiresAt: '',
            },
          }
        ),

        CoachingBooking.deleteOne({
          _id:
            booking._id,

          status:
            'pending_payment',

          paystackReference:
            reference,
        }),
      ])

      claimedReference =
        null

      claimedSlotId =
        null

      bookingId =
        null

      console.error(
        'Paystack connection error:',
        error
      )

      return NextResponse.json(
        {
          error:
            'Could not connect to Paystack. Please try again.',
        },
        {
          status: 502,
        }
      )
    }

    const paystackData =
      await paystackRes
        .json()
        .catch(() => null)

    if (
      !paystackRes.ok ||
      !paystackData?.status ||
      !paystackData?.data
    ) {
      /*
       * Paystack never created a usable payment,
       * so this booking record may safely be removed.
       */

      await Promise.allSettled([
        TutorAvailabilitySlot.updateOne(
          {
            _id:
              heldSlot._id,

            isBooked:
              false,

            holdReference:
              reference,
          },
          {
            $unset: {
              holdReference: '',
              holdStudentId: '',
              holdExpiresAt: '',
            },
          }
        ),

        CoachingBooking.deleteOne({
          _id:
            booking._id,

          status:
            'pending_payment',

          paystackReference:
            reference,
        }),
      ])

      claimedReference =
        null

      claimedSlotId =
        null

      bookingId =
        null

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

    /*
     * From here onward, do NOT delete the pending
     * CoachingBooking automatically.
     *
     * Paystack knows about this transaction now.
     * The record may later be needed for reconciliation.
     */

    claimedReference =
      null

    claimedSlotId =
      null

    bookingId =
      null

    return NextResponse.json({
      success: true,

      reference:
        paystackData.data.reference,

      accessCode:
        paystackData.data.access_code,

      authorizationUrl:
        paystackData.data.authorization_url,

      amount:
        rate,

      email:
        user.email,

      holdMinutes:
        HOLD_MINUTES,

      holdExpiresAt:
        holdExpiresAt.toISOString(),
    })
  } catch (error: any) {
    /*
     * If something crashed after the atomic hold but before
     * Paystack was successfully initialized, release the hold.
     *
     * This cleanup is restricted by holdReference so it cannot
     * accidentally release another student's reservation.
     */

    if (
      claimedReference &&
      claimedSlotId
    ) {
      await TutorAvailabilitySlot.updateOne(
        {
          _id:
            claimedSlotId,

          isBooked:
            false,

          holdReference:
            claimedReference,
        },
        {
          $unset: {
            holdReference: '',
            holdStudentId: '',
            holdExpiresAt: '',
          },
        }
      ).catch(
        (cleanupError) => {
          console.error(
            'Failed to release coaching hold after error:',
            cleanupError
          )
        }
      )

      if (bookingId) {
        await CoachingBooking.deleteOne({
          _id:
            bookingId,

          status:
            'pending_payment',

          paystackReference:
            claimedReference,
        }).catch(() => {})
      }
    }

    console.error(
      'Coaching booking initiate error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to initialize coaching booking',
      },
      {
        status: 500,
      }
    )
  }
}