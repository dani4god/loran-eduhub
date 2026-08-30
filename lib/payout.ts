// lib/payout.ts

import connectDB from '@/lib/mongodb'

import Payment from '@/models/Payment'
import PayoutLog from '@/models/PayoutLog'
import PlatformSettings from '@/models/PlatformSettings'
import CoachingBooking from '@/models/CoachingBooking'
import LessonNotePurchase from '@/models/LessonNotePurchase'

export const DEFAULT_COMMISSION_RATE =
  0.15

// ============================================================
// COMMISSION
// ============================================================

export async function getCommissionRate(): Promise<number> {
  await connectDB()

  const settings =
    await PlatformSettings.findOneAndUpdate(
      {
        key: 'global',
      },
      {
        $setOnInsert: {
          commissionRate:
            DEFAULT_COMMISSION_RATE,
        },
      },
      {
        upsert: true,
        new: true,
      }
    )

  const rate =
    Number(settings.commissionRate)

  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 1
  ) {
    return DEFAULT_COMMISSION_RATE
  }

  return rate
}

export async function setCommissionRate(
  rate: number
): Promise<number> {
  await connectDB()

  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 1
  ) {
    throw new Error(
      'Commission rate must be between 0 and 1'
    )
  }

  const settings =
    await PlatformSettings.findOneAndUpdate(
      {
        key: 'global',
      },
      {
        $set: {
          commissionRate: rate,
        },

        $setOnInsert: {
          key: 'global',
        },
      },
      {
        upsert: true,
        new: true,
      }
    )

  return Number(
    settings.commissionRate
  )
}

// ============================================================
// MONEY HELPER
// ============================================================

function calculatePayout(
  grossAmount: number,
  rate: number
) {
  const gross =
    Math.round(
      Number(grossAmount)
    )

  const commission =
    Math.round(
      gross * rate
    )

  const net =
    gross - commission

  return {
    gross,
    commission,
    net,
  }
}

// ============================================================
// REGULAR COURSE PAYMENTS
// ============================================================

export async function ensurePayoutLogs(): Promise<void> {
  await connectDB()

  const rate =
    await getCommissionRate()

  const unprocessed =
    await Payment.find({
      status: 'success',

      payoutLogged: {
        $ne: true,
      },
    })

  for (
    const payment
    of unprocessed as any[]
  ) {
    /**
     * Atomically claim this payment.
     *
     * Only one concurrent request can change payoutLogged
     * from not-true to true.
     */
    const claimed =
      await Payment.findOneAndUpdate(
        {
          _id: payment._id,

          payoutLogged: {
            $ne: true,
          },
        },
        {
          $set: {
            payoutLogged: true,
          },
        },
        {
          new: true,
        }
      )

    if (!claimed) {
      continue
    }

    try {
      const courseDetails =
        Array.isArray(
          payment.courseDetails
        )
          ? payment.courseDetails
          : []

      for (
        const detail
        of courseDetails
      ) {
        if (
          !detail?.tutorId ||
          !detail?.courseId
        ) {
          console.error(
            '[PAYOUT] Payment course detail missing tutorId/courseId',
            {
              paymentId:
                payment._id,
              detail,
            }
          )

          continue
        }

        const {
          gross,
          commission,
          net,
        } =
          calculatePayout(
            Number(
              detail.planPrice
            ),
            rate
          )

        if (gross <= 0) {
          console.error(
            '[PAYOUT] Invalid payment gross amount',
            {
              paymentId:
                payment._id,
              detail,
            }
          )

          continue
        }

        try {
          await PayoutLog.create({
            sourceModel:
              'Payment',

            paymentId:
              payment._id,

            studentId:
              payment.studentId ||
              undefined,

            tutorId:
              detail.tutorId,

            courseId:
              detail.courseId,

            grossAmount:
              gross,

            commissionRate:
              rate,

            commissionAmount:
              commission,

            netAmount:
              net,

            status:
              'pending',
          })
        } catch (
          error: any
        ) {
          /**
           * Duplicate key means the payout already exists.
           * This is safe and idempotent.
           */
          if (
            error?.code ===
            11000
          ) {
            continue
          }

          throw error
        }
      }
    } catch (error) {
      /**
       * Something genuinely failed while constructing payout
       * records. Release the claim so another request can retry.
       */
      await Payment.updateOne(
        {
          _id: payment._id,
        },
        {
          $set: {
            payoutLogged:
              false,
          },
        }
      )

      throw error
    }
  }
}

// ============================================================
// COACHING PAYOUTS
// ============================================================

export async function ensureCoachingPayoutLogs(): Promise<void> {
  await connectDB()

  const rate =
    await getCommissionRate()

  const unprocessed =
    await CoachingBooking.find({
      status:
        'confirmed',

      payoutLogged: {
        $ne: true,
      },
    })

  for (
    const booking
    of unprocessed as any[]
  ) {
    const claimed =
      await CoachingBooking.findOneAndUpdate(
        {
          _id: booking._id,

          status:
            'confirmed',

          payoutLogged: {
            $ne: true,
          },
        },
        {
          $set: {
            payoutLogged:
              true,
          },
        },
        {
          new: true,
        }
      )

    if (!claimed) {
      continue
    }

    try {
      if (
        !booking.tutorId ||
        !booking.courseId
      ) {
        throw new Error(
          `Coaching booking ${booking._id} is missing tutorId or courseId`
        )
      }

      const {
        gross,
        commission,
        net,
      } =
        calculatePayout(
          Number(
            booking.amountPaid
          ),
          rate
        )

      if (gross <= 0) {
        throw new Error(
          `Coaching booking ${booking._id} has an invalid amount`
        )
      }

      try {
        await PayoutLog.create({
          sourceModel:
            'CoachingBooking',

          bookingId:
            booking._id,

          studentId:
            booking.selfPacedStudentId ||
            undefined,

          tutorId:
            booking.tutorId,

          courseId:
            booking.courseId,

          grossAmount:
            gross,

          commissionRate:
            rate,

          commissionAmount:
            commission,

          netAmount:
            net,

          status:
            'pending',
        })
      } catch (
        error: any
      ) {
        if (
          error?.code ===
          11000
        ) {
          continue
        }

        throw error
      }
    } catch (error) {
      await CoachingBooking.updateOne(
        {
          _id: booking._id,
        },
        {
          $set: {
            payoutLogged:
              false,
          },
        }
      )

      throw error
    }
  }
}

// ============================================================
// LESSON NOTE PAYOUTS
// ============================================================

export async function ensureLessonNotePayoutLogs(): Promise<void> {
  await connectDB()

  const rate =
    await getCommissionRate()

  const unprocessed =
    await LessonNotePurchase.find({
      payoutLogged: {
        $ne: true,
      },
    })

  for (
    const purchase
    of unprocessed as any[]
  ) {
    /**
     * Every LessonNotePurchase document is independent.
     *
     * Purchase A:
     * reference = ABC
     *
     * Purchase B:
     * reference = XYZ
     *
     * Even if both are for the same LessonNote,
     * both generate their own PayoutLog.
     */
    const claimed =
      await LessonNotePurchase.findOneAndUpdate(
        {
          _id:
            purchase._id,

          payoutLogged: {
            $ne: true,
          },
        },
        {
          $set: {
            payoutLogged:
              true,
          },
        },
        {
          new: true,
        }
      )

    if (!claimed) {
      continue
    }

    try {
      if (
        !purchase.tutorId ||
        !purchase.lessonNoteId
      ) {
        throw new Error(
          `Lesson note purchase ${purchase._id} is missing tutorId or lessonNoteId`
        )
      }

      const {
        gross,
        commission,
        net,
      } =
        calculatePayout(
          Number(
            purchase.amountPaid
          ),
          rate
        )

      if (gross <= 0) {
        throw new Error(
          `Lesson note purchase ${purchase._id} has an invalid amount`
        )
      }

      try {
        await PayoutLog.create({
          sourceModel:
            'LessonNotePurchase',

          purchaseId:
            purchase._id,

          /**
           * Your current LessonNotePurchase model may not have
           * studentId. Leave it absent when the purchase was
           * public/anonymous.
           */
          studentId:
            purchase.studentId ||
            undefined,

          tutorId:
            purchase.tutorId,

          courseId:
            purchase.lessonNoteId,

          grossAmount:
            gross,

          commissionRate:
            rate,

          commissionAmount:
            commission,

          netAmount:
            net,

          status:
            'pending',
        })
      } catch (
        error: any
      ) {
        /**
         * If this exact purchase already has a PayoutLog,
         * that is fine.
         */
        if (
          error?.code ===
          11000
        ) {
          continue
        }

        throw error
      }
    } catch (error) {
      /**
       * A genuine failure occurred.
       * Release payoutLogged so it can be retried.
       */
      await LessonNotePurchase.updateOne(
        {
          _id:
            purchase._id,
        },
        {
          $set: {
            payoutLogged:
              false,
          },
        }
      )

      throw error
    }
  }
}

// ============================================================
// ALL PAYOUT SOURCES
// ============================================================

export async function ensureAllPayoutLogs(): Promise<void> {
  await ensurePayoutLogs()

  await ensureCoachingPayoutLogs()

  await ensureLessonNotePayoutLogs()
}