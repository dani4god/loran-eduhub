// app/api/admin/payouts/dedupe/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getToken,
} from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import PayoutLog from '@/models/PayoutLog'

interface DuplicateRow {
  _id: any
  createdAt: Date
  status: string
}

async function cleanGroups(
  groups: any[]
) {
  let removed =
    0

  let resetToPending =
    0

  for (
    const group
    of groups
  ) {
    const rows: DuplicateRow[] =
      [...group.rows].sort(
        (
          a:
            DuplicateRow,
          b:
            DuplicateRow
        ) =>
          new Date(
            a.createdAt
          ).getTime() -
          new Date(
            b.createdAt
          ).getTime()
      )

    if (
      rows.length <=
      1
    ) {
      continue
    }

    /**
     * If one duplicate was already manually paid,
     * preserve that one.
     *
     * Otherwise preserve the oldest record.
     */
    const paidRow =
      rows.find(
        (row) =>
          row.status ===
          'paid'
      )

    const keepRow =
      paidRow ||
      rows[0]

    const removeIds =
      rows
        .filter(
          (row) =>
            row._id.toString() !==
            keepRow._id.toString()
        )
        .map(
          (row) =>
            row._id
        )

    if (
      removeIds.length >
      0
    ) {
      const result =
        await PayoutLog.deleteMany({
          _id: {
            $in:
              removeIds,
          },
        })

      removed +=
        result.deletedCount ||
        0
    }

    const kept =
      await PayoutLog.findById(
        keepRow._id
      )

    if (
      kept &&
      kept.status !==
        'paid' &&
      (
        kept.status ===
          'failed' ||
        kept.status ===
          'processing'
      )
    ) {
      kept.status =
        'pending'

      kept.failureReason =
        undefined

      kept.paystackTransferCode =
        undefined

      kept.paystackTransferReference =
        undefined

      await kept.save()

      resetToPending++
    }
  }

  return {
    removed,
    resetToPending,
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const token =
      await getToken({
        req,
      })

    if (
      !token ||
      token.role !==
        'admin'
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

    await connectDB()

    // ========================================================
    // PAYMENT DUPLICATES
    // ========================================================

    /**
     * Regular payment uniqueness:
     *
     * paymentId
     * + tutorId
     * + courseId
     */
    const paymentGroups =
      await PayoutLog.aggregate([
        {
          $match: {
            sourceModel:
              'Payment',

            paymentId: {
              $exists:
                true,

              $ne:
                null,
            },
          },
        },

        {
          $group: {
            _id: {
              paymentId:
                '$paymentId',

              tutorId:
                '$tutorId',

              courseId:
                '$courseId',
            },

            rows: {
              $push: {
                _id:
                  '$_id',

                createdAt:
                  '$createdAt',

                status:
                  '$status',
              },
            },

            count: {
              $sum:
                1,
            },
          },
        },

        {
          $match: {
            count: {
              $gt:
                1,
            },
          },
        },
      ])

    // ========================================================
    // COACHING DUPLICATES
    // ========================================================

    /**
     * Each bookingId represents one coaching transaction.
     */
    const coachingGroups =
      await PayoutLog.aggregate([
        {
          $match: {
            sourceModel:
              'CoachingBooking',

            bookingId: {
              $exists:
                true,

              $ne:
                null,
            },
          },
        },

        {
          $group: {
            _id: {
              bookingId:
                '$bookingId',
            },

            rows: {
              $push: {
                _id:
                  '$_id',

                createdAt:
                  '$createdAt',

                status:
                  '$status',
              },
            },

            count: {
              $sum:
                1,
            },
          },
        },

        {
          $match: {
            count: {
              $gt:
                1,
            },
          },
        },
      ])

    // ========================================================
    // LESSON NOTE DUPLICATES
    // ========================================================

    /**
     * Each purchaseId represents one sale.
     *
     * IMPORTANT:
     *
     * Two purchases of the SAME note have two different
     * purchaseIds. They must NOT be considered duplicates.
     */
    const lessonNoteGroups =
      await PayoutLog.aggregate([
        {
          $match: {
            sourceModel:
              'LessonNotePurchase',

            purchaseId: {
              $exists:
                true,

              $ne:
                null,
            },
          },
        },

        {
          $group: {
            _id: {
              purchaseId:
                '$purchaseId',
            },

            rows: {
              $push: {
                _id:
                  '$_id',

                createdAt:
                  '$createdAt',

                status:
                  '$status',
              },
            },

            count: {
              $sum:
                1,
            },
          },
        },

        {
          $match: {
            count: {
              $gt:
                1,
            },
          },
        },
      ])

    const paymentResult =
      await cleanGroups(
        paymentGroups
      )

    const coachingResult =
      await cleanGroups(
        coachingGroups
      )

    const lessonNoteResult =
      await cleanGroups(
        lessonNoteGroups
      )

    const removed =
      paymentResult.removed +
      coachingResult.removed +
      lessonNoteResult.removed

    const resetToPending =
      paymentResult.resetToPending +
      coachingResult.resetToPending +
      lessonNoteResult.resetToPending

    return NextResponse.json({
      success:
        true,

      duplicateGroupsFound:
        paymentGroups.length +
        coachingGroups.length +
        lessonNoteGroups.length,

      paymentDuplicateGroups:
        paymentGroups.length,

      coachingDuplicateGroups:
        coachingGroups.length,

      lessonNoteDuplicateGroups:
        lessonNoteGroups.length,

      removed,

      resetToPending,
    })
  } catch (error) {
    console.error(
      '[PAYOUT DEDUPE ERROR]',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to clean up payout records',
      },
      {
        status: 500,
      }
    )
  }
}