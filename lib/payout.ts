// lib/payout.ts

import connectDB from '@/lib/mongodb'

import PlatformSettings from '@/models/PlatformSettings'

import Payment from '@/models/Payment'
import CoachingBooking from '@/models/CoachingBooking'
import LessonNotePurchase from '@/models/LessonNotePurchase'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'

import PayoutLog from '@/models/PayoutLog'

const DEFAULT_COMMISSION_RATE =
  0.15

/**
 * ---------------------------------------------------------
 * GET PLATFORM COMMISSION
 * ---------------------------------------------------------
 */

export async function getCommissionRate(): Promise<number> {
  await connectDB()

  let settings =
    await PlatformSettings.findOne({
      key: 'global',
    })

  if (!settings) {
    settings =
      await PlatformSettings.findOneAndUpdate(
        {
          key: 'global',
        },

        {
          $setOnInsert: {
            key: 'global',

            commissionRate:
              DEFAULT_COMMISSION_RATE,
          },
        },

        {
          new: true,
          upsert: true,
        }
      )
  }

  const rate =
    Number(
      settings?.commissionRate
    )

  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 1
  ) {
    return DEFAULT_COMMISSION_RATE
  }

  return rate
}

/**
 * ---------------------------------------------------------
 * UPDATE PLATFORM COMMISSION
 * ---------------------------------------------------------
 */

export async function setCommissionRate(
  rate: number
) {
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

  return PlatformSettings.findOneAndUpdate(
    {
      key: 'global',
    },

    {
      $set: {
        commissionRate:
          rate,
      },
    },

    {
      new: true,
      upsert: true,
    }
  )
}

/**
 * ---------------------------------------------------------
 * CALCULATE PAYOUT
 * ---------------------------------------------------------
 */

function calculatePayout(
  grossAmount: number,
  commissionRate: number
) {
  const gross =
    Number(grossAmount)

  const rate =
    Number(commissionRate)

  const commissionAmount =
    Number(
      (
        gross *
        rate
      ).toFixed(2)
    )

  const netAmount =
    Number(
      (
        gross -
        commissionAmount
      ).toFixed(2)
    )

  return {
    grossAmount:
      gross,

    commissionRate:
      rate,

    commissionAmount,

    netAmount,
  }
}

/**
 * =========================================================
 * REGULAR COURSE PAYOUTS
 * =========================================================
 */

export async function ensurePayoutLogs() {
  await connectDB()

  const commissionRate =
    await getCommissionRate()

  const payments =
    await Payment.find({
      status: 'success',

      payoutLogged: {
        $ne: true,
      },
    })

  for (const payment of payments) {
    try {
      const courseDetails =
        Array.isArray(
          (payment as any)
            .courseDetails
        )
          ? (payment as any)
              .courseDetails
          : []

      /**
       * If this payment has no course details,
       * don't mark it as payoutLogged.
       */
      if (
        courseDetails.length ===
        0
      ) {
        continue
      }

      for (
        const detail of courseDetails
      ) {
        const tutorId =
          detail?.tutorId

        const courseId =
          detail?.courseId

        const amount =
          Number(
            detail?.amount ||
              detail?.price ||
              0
          )

        if (
          !tutorId ||
          !courseId ||
          !Number.isFinite(
            amount
          ) ||
          amount <= 0
        ) {
          continue
        }

        const existing =
          await PayoutLog.findOne({
            sourceModel:
              'Payment',

            paymentId:
              payment._id,

            tutorId,

            courseId,
          })

        if (existing) {
          continue
        }

        const payout =
          calculatePayout(
            amount,
            commissionRate
          )

        try {
          await PayoutLog.create({
            sourceModel:
              'Payment',

            paymentId:
              payment._id,

            studentId:
              (payment as any)
                .studentId,

            tutorId,

            courseId,

            ...payout,

            status:
              'pending',
          })
        } catch (error: any) {
          if (
            error?.code ===
            11000
          ) {
            const duplicate =
              await PayoutLog.findOne({
                sourceModel:
                  'Payment',

                paymentId:
                  payment._id,

                tutorId,

                courseId,
              })

            if (duplicate) {
              continue
            }
          }

          throw error
        }
      }

      /**
       * Only mark the Payment as logged
       * once all its valid course payouts
       * have been handled.
       */
      ;(payment as any).payoutLogged =
        true

      await payment.save()
    } catch (error) {
      ;(payment as any).payoutLogged =
        false

      await payment
        .save()
        .catch(() => {})

      console.error(
        '[REGULAR PAYMENT PAYOUT ERROR]',
        {
          paymentId:
            payment._id,
          error,
        }
      )

      throw error
    }
  }
}

/**
 * =========================================================
 * SELF-PACED COURSE PAYOUTS
 * =========================================================
 */

export async function ensureSelfPacedEnrollmentPayoutLogs() {
  await connectDB()

  const commissionRate =
    await getCommissionRate()

  /**
   * amountPaid > 0 means free courses
   * are automatically excluded.
   */
  const enrollments =
    await SelfPacedEnrollment.find({
      payoutLogged: {
        $ne: true,
      },

      amountPaid: {
        $gt: 0,
      },
    })

  for (
    const enrollment of enrollments
  ) {
    try {
      const existing =
        await PayoutLog.findOne({
          sourceModel:
            'SelfPacedEnrollment',

          selfPacedEnrollmentId:
            enrollment._id,
        })

      if (existing) {
        enrollment.payoutLogged =
          true

        await enrollment.save()

        continue
      }

      const grossAmount =
        Number(
          enrollment.amountPaid ||
            0
        )

      if (
        !Number.isFinite(
          grossAmount
        ) ||
        grossAmount <= 0
      ) {
        continue
      }

      const payout =
        calculatePayout(
          grossAmount,
          commissionRate
        )

      try {
        await PayoutLog.create({
          sourceModel:
            'SelfPacedEnrollment',

          selfPacedEnrollmentId:
            enrollment._id,

          studentId:
            enrollment.selfPacedStudentId,

          tutorId:
            enrollment.tutorId,

          courseId:
            enrollment.courseId,

          ...payout,

          status:
            'pending',
        })
      } catch (error: any) {
        /**
         * Only consider E11000 harmless
         * if the payout for this exact
         * enrollment exists.
         */
        if (
          error?.code ===
          11000
        ) {
          const duplicate =
            await PayoutLog.findOne({
              sourceModel:
                'SelfPacedEnrollment',

              selfPacedEnrollmentId:
                enrollment._id,
            })

          if (duplicate) {
            enrollment.payoutLogged =
              true

            await enrollment.save()

            continue
          }
        }

        throw error
      }

      enrollment.payoutLogged =
        true

      await enrollment.save()
    } catch (error) {
      enrollment.payoutLogged =
        false

      await enrollment
        .save()
        .catch(() => {})

      console.error(
        '[SELF PACED PAYOUT ERROR]',
        {
          enrollmentId:
            enrollment._id,
          error,
        }
      )

      throw error
    }
  }
}

/**
 * =========================================================
 * COACHING PAYOUTS
 * =========================================================
 */

export async function ensureCoachingPayoutLogs() {
  await connectDB()

  const commissionRate =
    await getCommissionRate()

  const bookings =
    await CoachingBooking.find({
      status:
        'confirmed',

      payoutLogged: {
        $ne: true,
      },
    })

  for (
    const booking of bookings
  ) {
    try {
      const existing =
        await PayoutLog.findOne({
          sourceModel:
            'CoachingBooking',

          bookingId:
            booking._id,
        })

      if (existing) {
        booking.payoutLogged =
          true

        await booking.save()

        continue
      }

      const grossAmount =
        Number(
          booking.amountPaid ||
            0
        )

      if (
        !Number.isFinite(
          grossAmount
        ) ||
        grossAmount <= 0
      ) {
        continue
      }

      const payout =
        calculatePayout(
          grossAmount,
          commissionRate
        )

      try {
        await PayoutLog.create({
          sourceModel:
            'CoachingBooking',

          bookingId:
            booking._id,

          studentId:
            booking.selfPacedStudentId,

          tutorId:
            booking.tutorId,

          courseId:
            booking.courseId,

          ...payout,

          status:
            'pending',
        })
      } catch (error: any) {
        if (
          error?.code ===
          11000
        ) {
          const duplicate =
            await PayoutLog.findOne({
              sourceModel:
                'CoachingBooking',

              bookingId:
                booking._id,
            })

          if (duplicate) {
            booking.payoutLogged =
              true

            await booking.save()

            continue
          }
        }

        throw error
      }

      booking.payoutLogged =
        true

      /**
       * Keep the booking's snapshot fields
       * consistent with the payout calculation
       * if those fields exist in the model.
       */
      booking.commissionAmount =
        payout.commissionAmount

      booking.netAmount =
        payout.netAmount

      await booking.save()
    } catch (error) {
      booking.payoutLogged =
        false

      await booking
        .save()
        .catch(() => {})

      console.error(
        '[COACHING PAYOUT ERROR]',
        {
          bookingId:
            booking._id,
          error,
        }
      )

      throw error
    }
  }
}

/**
 * =========================================================
 * LESSON NOTE PAYOUTS
 * =========================================================
 */

export async function ensureLessonNotePayoutLogs() {
  await connectDB()

  const commissionRate =
    await getCommissionRate()

  const purchases =
    await LessonNotePurchase.find({
      payoutLogged: {
        $ne: true,
      },
    })

  for (
    const purchase of purchases
  ) {
    try {
      const existing =
        await PayoutLog.findOne({
          sourceModel:
            'LessonNotePurchase',

          purchaseId:
            purchase._id,
        })

      if (existing) {
        purchase.payoutLogged =
          true

        await purchase.save()

        continue
      }

      const grossAmount =
        Number(
          purchase.amountPaid ||
            0
        )

      if (
        !Number.isFinite(
          grossAmount
        ) ||
        grossAmount <= 0
      ) {
        continue
      }

      const payout =
        calculatePayout(
          grossAmount,
          commissionRate
        )

      try {
        await PayoutLog.create({
          sourceModel:
            'LessonNotePurchase',

          purchaseId:
            purchase._id,

          tutorId:
            purchase.tutorId,

          /**
           * For lesson-note payouts,
           * courseId is intentionally
           * the LessonNote ID.
           */
          courseId:
            purchase.lessonNoteId,

          ...payout,

          status:
            'pending',
        })
      } catch (error: any) {
        /**
         * Very important:
         *
         * Don't treat every E11000 as a
         * successful duplicate.
         *
         * Confirm that THIS exact purchase
         * already has its payout.
         */
        if (
          error?.code ===
          11000
        ) {
          const duplicate =
            await PayoutLog.findOne({
              sourceModel:
                'LessonNotePurchase',

              purchaseId:
                purchase._id,
            })

          if (duplicate) {
            purchase.payoutLogged =
              true

            await purchase.save()

            continue
          }
        }

        throw error
      }

      purchase.payoutLogged =
        true

      await purchase.save()
    } catch (error) {
      purchase.payoutLogged =
        false

      await purchase
        .save()
        .catch(() => {})

      console.error(
        '[LESSON NOTE PAYOUT ERROR]',
        {
          purchaseId:
            purchase._id,
          error,
        }
      )

      throw error
    }
  }
}

/**
 * =========================================================
 * ENSURE EVERYTHING
 * =========================================================
 */

export async function ensureAllPayoutLogs() {
  await ensurePayoutLogs()

  await ensureSelfPacedEnrollmentPayoutLogs()

  await ensureCoachingPayoutLogs()

  await ensureLessonNotePayoutLogs()
}