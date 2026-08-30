// app/api/self-paced/booking/verify/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import CoachingBooking from '@/models/CoachingBooking'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'

async function verifyWithPaystack(
  reference: string
) {
  const secret =
    process.env.PAYSTACK_SECRET_KEY

  if (!secret) {
    throw new Error(
      'Paystack is not configured on the server'
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

  const body =
    await res
      .json()
      .catch(() => null)

  return {
    ok:
      res.ok,

    body,
  }
}

export async function GET(
  req: NextRequest
) {
  try {
    const { searchParams } =
      new URL(req.url)

    const reference =
      searchParams
        .get('reference')
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

    // ========================================================
    // BOOKING
    // ========================================================

    const booking =
      await CoachingBooking.findOne({
        paystackReference:
          reference,
      })

    if (!booking) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Booking not found',
        },
        {
          status: 404,
        }
      )
    }

    // ========================================================
    // IDEMPOTENCY
    // ========================================================

    if (
      booking.status ===
      'confirmed'
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyProcessed:
          true,
      })
    }

    // ========================================================
    // PAYSTACK
    // ========================================================

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

    // ========================================================
    // REFERENCE
    // ========================================================

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
            'Payment reference does not match booking',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // STATUS
    // ========================================================

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

    // ========================================================
    // CURRENCY
    // ========================================================

    if (
      transaction.currency !==
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

    // ========================================================
    // AMOUNT
    // ========================================================

    const expectedAmount =
      Math.round(
        Number(
          booking.amountPaid
        ) * 100
      )

    const paidAmount =
      Number(
        transaction.amount ||
          0
      )

    if (
      !Number.isFinite(
        paidAmount
      ) ||
      expectedAmount !==
        paidAmount
    ) {
      console.error(
        'Coaching amount mismatch',
        {
          reference,
          expectedAmount,
          paidAmount,
        }
      )

      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment amount does not match the coaching fee',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // METADATA
    // ========================================================

    const metadata =
      transaction.metadata || {}

    if (
      metadata.type !==
      'coaching_booking'
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

    if (
      String(
        metadata.courseId ||
          ''
      ) !==
      booking.courseId.toString()
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment course does not match booking',
        },
        {
          status: 400,
        }
      )
    }

    if (
      String(
        metadata.slotId ||
          ''
      ) !==
      booking.slotId.toString()
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment slot does not match booking',
        },
        {
          status: 400,
        }
      )
    }

    if (
      String(
        metadata.studentId ||
          ''
      ) !==
      booking.selfPacedStudentId.toString()
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment student does not match booking',
        },
        {
          status: 400,
        }
      )
    }

    if (
      String(
        metadata.tutorId ||
          ''
      ) !==
      booking.tutorId.toString()
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment tutor does not match booking',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // CONFIRM THE EXACT RESERVED SLOT
    // ========================================================

    /*
     * Notice that we DO NOT require:
     *
     * holdExpiresAt > now
     *
     * A student may finish Paystack slightly after 15 minutes.
     *
     * If nobody else has taken the expired hold yet,
     * holdReference will still match and this payment can
     * safely win.
     *
     * If another student already acquired the expired slot,
     * holdReference will have changed and this update fails.
     */

    const claimedSlot =
      await TutorAvailabilitySlot.findOneAndUpdate(
        {
          _id:
            booking.slotId,

          courseId:
            booking.courseId,

          tutorId:
            booking.tutorId,

          isBooked:
            false,

          holdReference:
            reference,

          holdStudentId:
            booking.selfPacedStudentId,
        },
        {
          $set: {
            isBooked:
              true,
          },

          $unset: {
            holdReference: '',
            holdStudentId: '',
            holdExpiresAt: '',
          },
        },
        {
          new: true,
        }
      )

    if (!claimedSlot) {
      /*
       * Another verification request may have completed
       * between our original status check and this update.
       */

      const latestBooking =
        await CoachingBooking.findById(
          booking._id
        ).select(
          'status'
        )

      if (
        latestBooking?.status ===
        'confirmed'
      ) {
        return NextResponse.json({
          success:
            true,

          alreadyProcessed:
            true,
        })
      }

      /*
       * Payment succeeded but this hold is no longer the
       * active owner of the slot.
       *
       * Do NOT grant another slot automatically.
       * Keep the payment reference for support/reconciliation.
       */

      console.error(
        'Successful coaching payment lost slot',
        {
          reference,

          bookingId:
            booking._id.toString(),

          slotId:
            booking.slotId.toString(),

          studentId:
            booking.selfPacedStudentId.toString(),
        }
      )

      return NextResponse.json(
        {
          success:
            false,

          paymentSuccessful:
            true,

          requiresSupport:
            true,

          reference,

          error:
            'Your payment was successful, but this coaching slot is no longer available. Please contact support with this payment reference for a refund or another slot.',
        },
        {
          status: 409,
        }
      )
    }

    // ========================================================
    // CONFIRM BOOKING
    // ========================================================

    try {
      const confirmedBooking =
        await CoachingBooking.findOneAndUpdate(
          {
            _id:
              booking._id,

            status:
              'pending_payment',
          },
          {
            $set: {
              status:
                'confirmed',
            },
          },
          {
            new: true,
          }
        )

      if (!confirmedBooking) {
        const latest =
          await CoachingBooking.findById(
            booking._id
          ).select(
            'status'
          )

        if (
          latest?.status ===
          'confirmed'
        ) {
          return NextResponse.json({
            success:
              true,

            alreadyProcessed:
              true,
          })
        }

        throw new Error(
          'Could not update booking status'
        )
      }
    } catch (error) {
      /*
       * Payment is successful but booking confirmation failed.
       *
       * Restore the same student's hold rather than making the
       * slot immediately available to somebody else.
       *
       * This gives verification/support a chance to recover.
       */

      const recoveryExpiry =
        new Date(
          Date.now() +
            15 *
              60 *
              1000
        )

      await TutorAvailabilitySlot.updateOne(
        {
          _id:
            booking.slotId,

          isBooked:
            true,
        },
        {
          $set: {
            isBooked:
              false,

            holdReference:
              reference,

            holdStudentId:
              booking.selfPacedStudentId,

            holdExpiresAt:
              recoveryExpiry,
          },
        }
      ).catch(
        (rollbackError) => {
          console.error(
            'Failed to restore coaching slot after booking confirmation error:',
            rollbackError
          )
        }
      )

      throw error
    }

    return NextResponse.json({
      success:
        true,

      alreadyProcessed:
        false,

      reference,
    })
  } catch (error: any) {
    console.error(
      'Coaching booking verification error:',
      error
    )

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          'Failed to verify coaching payment',
      },
      {
        status: 500,
      }
    )
  }
}