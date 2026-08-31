// app/api/self-paced/purchase/verify/route.ts

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

import {
  syncSelfPacedStudentDiscordRoles,
} from '@/lib/discordSync'

import {
  ensureSelfPacedEnrollmentPayoutLogs,
} from '@/lib/payout'

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

  const res =
    await fetch(
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
    ok:
      res.ok,

    body:
      data,
  }
}

export async function GET(
  req: NextRequest
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        req.url
      )

    const reference =
      searchParams
        .get(
          'reference'
        )
        ?.trim()

    if (!reference) {
      return NextResponse.json(
        {
          success:
            false,

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
      body:
        verification,
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
          success:
            false,

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

    /**
     * -------------------------------------------------------
     * VERIFY STATUS
     * -------------------------------------------------------
     */

    if (
      transaction.status !==
      'success'
    ) {
      return NextResponse.json(
        {
          success:
            false,

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

    /**
     * -------------------------------------------------------
     * VERIFY REFERENCE
     * -------------------------------------------------------
     */

    if (
      String(
        transaction.reference ||
          ''
      ) !== reference
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment reference mismatch',
        },
        {
          status: 400,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * VERIFY CURRENCY
     * -------------------------------------------------------
     */

    if (
      String(
        transaction.currency ||
          ''
      ).toUpperCase() !==
      'NGN'
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Invalid payment currency',
        },
        {
          status: 400,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * VERIFY METADATA
     * -------------------------------------------------------
     */

    const metadata =
      transaction.metadata ||
      {}

    if (
      metadata.type !==
      'self_paced_purchase'
    ) {
      return NextResponse.json(
        {
          success:
            false,

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
          success:
            false,

          error:
            'Invalid payment metadata',
        },
        {
          status: 400,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * COURSE
     * -------------------------------------------------------
     */

    const course =
      await SelfPacedCourse.findById(
        courseId
      )

    if (!course) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Course not found',
        },
        {
          status: 404,
        }
      )
    }

    const coursePrice =
      Number(
        course.price
      )

    if (
      !Number.isFinite(
        coursePrice
      ) ||
      coursePrice <= 0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Invalid paid course amount',
        },
        {
          status: 400,
        }
      )
    }

    const expectedAmount =
      Math.round(
        coursePrice *
          100
      )

    if (
      Number(
        transaction.amount
      ) !==
      expectedAmount
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
          success:
            false,

          error:
            'Payment amount mismatch',
        },
        {
          status: 400,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * STUDENT
     * -------------------------------------------------------
     */

    const student =
      await SelfPacedStudent.findOne({
        _id:
          studentId,

        userId,
      })

    if (!student) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Student account not found',
        },
        {
          status: 404,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * USER
     * -------------------------------------------------------
     */

    const user =
      await User.findById(
        userId
      )

    if (!user) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'User account not found',
        },
        {
          status: 404,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * VERIFY CUSTOMER EMAIL
     * -------------------------------------------------------
     */

    const transactionEmail =
      transaction
        ?.customer
        ?.email
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
          success:
            false,

          error:
            'Payment email does not match the student account',
        },
        {
          status: 400,
        }
      )
    }

    /**
     * =======================================================
     * IDEMPOTENCY
     * =======================================================
     */

    const existing =
      await SelfPacedEnrollment.findOne({
        selfPacedStudentId:
          student._id,

        courseId:
          course._id,
      })

    if (existing) {
      /**
       * If a paid enrollment already exists,
       * it should belong to the same Paystack
       * payment.
       */
      if (
        Number(
          existing.amountPaid ||
            0
        ) >
          0 &&
        existing.paystackReference &&
        existing.paystackReference !==
          reference
      ) {
        return NextResponse.json(
          {
            success:
              false,

            error:
              'This course has already been purchased with a different payment reference',
          },
          {
            status: 409,
          }
        )
      }

      if (!user.isActive) {
        user.isActive =
          true

        await user.save()
      }

      /**
       * Repair payout if enrollment exists
       * but payout creation previously failed.
       */
      if (
        Number(
          existing.amountPaid ||
            0
        ) > 0
      ) {
        await ensureSelfPacedEnrollmentPayoutLogs()
          .catch(
            (
              error
            ) => {
              console.error(
                'Self-paced payout reconciliation failed:',
                error
              )
            }
          )
      }

      if (
        student.discordId
      ) {
        await syncSelfPacedStudentDiscordRoles(
          student._id.toString(),
          student.discordId
        ).catch(
          (
            error
          ) => {
            console.error(
              'Self-paced Discord sync failed:',
              error
            )
          }
        )
      }

      return NextResponse.json({
        success:
          true,

        alreadyProcessed:
          true,

        enrollmentId:
          existing._id.toString(),
      })
    }

    /**
     * =======================================================
     * CREATE ENROLLMENT
     * =======================================================
     */

    let enrollment

    try {
      enrollment =
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
            ) /
            100,

          paystackReference:
            reference,

          payoutLogged:
            false,

          weekProgress:
            [],
        })
    } catch (
      error: any
    ) {
      /**
       * Unique index:
       *
       * selfPacedStudentId + courseId
       *
       * OR duplicate Paystack reference.
       *
       * Confirm the actual enrollment rather
       * than blindly treating every E11000 as
       * a successful callback.
       */
      if (
        error?.code ===
        11000
      ) {
        const duplicate =
          await SelfPacedEnrollment.findOne({
            selfPacedStudentId:
              student._id,

            courseId:
              course._id,
          })

        if (
          duplicate &&
          (
            !duplicate.paystackReference ||
            duplicate.paystackReference ===
              reference
          )
        ) {
          if (
            !user.isActive
          ) {
            user.isActive =
              true

            await user.save()
          }

          await ensureSelfPacedEnrollmentPayoutLogs()
            .catch(
              (
                payoutError
              ) => {
                console.error(
                  'Self-paced payout reconciliation failed:',
                  payoutError
                )
              }
            )

          return NextResponse.json({
            success:
              true,

            alreadyProcessed:
              true,

            enrollmentId:
              duplicate._id.toString(),
          })
        }
      }

      throw error
    }

    /**
     * -------------------------------------------------------
     * ACTIVATE ACCOUNT
     * -------------------------------------------------------
     */

    if (!user.isActive) {
      user.isActive =
        true

      await user.save()
    }

    /**
     * -------------------------------------------------------
     * CREATE TUTOR PAYOUT
     * -------------------------------------------------------
     *
     * Don't fail the student's successful
     * purchase if payout logging temporarily
     * fails.
     *
     * payoutLogged stays false and the
     * reconciliation system can recover it.
     */

    await ensureSelfPacedEnrollmentPayoutLogs()
      .catch(
        (
          error
        ) => {
          console.error(
            'Could not create self-paced tutor payout:',
            error
          )
        }
      )

    /**
     * -------------------------------------------------------
     * DISCORD
     * -------------------------------------------------------
     */

    if (
      student.discordId
    ) {
      await syncSelfPacedStudentDiscordRoles(
        student._id.toString(),
        student.discordId
      ).catch(
        (
          error
        ) => {
          console.error(
            'Self-paced Discord sync failed:',
            error
          )
        }
      )
    }

    return NextResponse.json({
      success:
        true,

      alreadyProcessed:
        false,

      enrollmentId:
        enrollment._id.toString(),
    })
  } catch (
    error: any
  ) {
    console.error(
      'Self-paced purchase verify error:',
      error
    )

    return NextResponse.json(
      {
        success:
          false,

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