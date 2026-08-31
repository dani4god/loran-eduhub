// app/api/admin/payouts/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getToken,
} from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import PayoutLog from '@/models/PayoutLog'

import Tutor from '@/models/Tutor'

import Student from '@/models/Student'
import SelfPacedStudent from '@/models/SelfPacedStudent'

import Course from '@/models/Course'
import SelfPacedCourse from '@/models/SelfPacedCourse'

import LessonNote from '@/models/LessonNote'
import LessonNotePurchase from '@/models/LessonNotePurchase'

import {
  ensureAllPayoutLogs,
} from '@/lib/payout'

function getSourceLabel(
  sourceModel: string
) {
  switch (sourceModel) {
    case 'Payment':
      return 'Course Enrollment'

    case 'SelfPacedEnrollment':
      return 'Self-Paced Course'

    case 'CoachingBooking':
      return 'Coaching Session'

    case 'LessonNotePurchase':
      return 'Lesson Note Purchase'

    default:
      return 'Payment'
  }
}

export async function GET(
  req: NextRequest
) {
  try {
    /**
     * ======================================================
     * AUTH
     * ======================================================
     */

    const token =
      await getToken({
        req,
        secret:
          process.env
            .NEXTAUTH_SECRET,
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

    /**
     * ======================================================
     * DATABASE
     * ======================================================
     */

    await connectDB()

    /**
     * Make sure every valid transaction
     * has a corresponding payout record.
     *
     * Handles:
     *
     * Payment
     * SelfPacedEnrollment
     * CoachingBooking
     * LessonNotePurchase
     */
    await ensureAllPayoutLogs()

    /**
     * ======================================================
     * QUERY PARAMS
     * ======================================================
     */

    const {
      searchParams,
    } =
      new URL(
        req.url
      )

    const status =
      searchParams
        .get('status')
        ?.trim()
        .toLowerCase() ||
      'pending'

    const validStatuses = [
      'pending',
      'processing',
      'paid',
      'failed',
      'all',
    ]

    if (
      !validStatuses.includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid payout status',
        },
        {
          status: 400,
        }
      )
    }

    /**
     * ======================================================
     * PAYOUT FILTER
     * ======================================================
     */

    const filter:
      Record<
        string,
        any
      > = {}

    if (
      status !==
      'all'
    ) {
      filter.status =
        status
    }

    /**
     * ======================================================
     * FETCH PAYOUTS
     * ======================================================
     */

    const logs =
      await PayoutLog.find(
        filter
      )
        .sort({
          createdAt:
            -1,
        })
        .lean()

    /**
     * ======================================================
     * COLLECT RELATED IDS
     * ======================================================
     */

    const tutorIds = [
      ...new Set(
        logs
          .map(
            (
              log: any
            ) =>
              log.tutorId?.toString()
          )
          .filter(
            Boolean
          )
      ),
    ]

    /**
     * Regular course students
     */
    const regularStudentIds = [
      ...new Set(
        logs
          .filter(
            (
              log: any
            ) =>
              log.sourceModel ===
              'Payment'
          )
          .map(
            (
              log: any
            ) =>
              log.studentId?.toString()
          )
          .filter(
            Boolean
          )
      ),
    ]

    /**
     * Self-paced students are used for:
     *
     * SelfPacedEnrollment
     * CoachingBooking
     */
    const selfPacedStudentIds = [
      ...new Set(
        logs
          .filter(
            (
              log: any
            ) =>
              log.sourceModel ===
                'SelfPacedEnrollment' ||
              log.sourceModel ===
                'CoachingBooking'
          )
          .map(
            (
              log: any
            ) =>
              log.studentId?.toString()
          )
          .filter(
            Boolean
          )
      ),
    ]

    /**
     * Regular Course IDs
     */
    const regularCourseIds = [
      ...new Set(
        logs
          .filter(
            (
              log: any
            ) =>
              log.sourceModel ===
              'Payment'
          )
          .map(
            (
              log: any
            ) =>
              log.courseId?.toString()
          )
          .filter(
            Boolean
          )
      ),
    ]

    /**
     * Self-paced Course IDs
     *
     * Used by:
     *
     * SelfPacedEnrollment
     * CoachingBooking
     */
    const selfPacedCourseIds = [
      ...new Set(
        logs
          .filter(
            (
              log: any
            ) =>
              log.sourceModel ===
                'SelfPacedEnrollment' ||
              log.sourceModel ===
                'CoachingBooking'
          )
          .map(
            (
              log: any
            ) =>
              log.courseId?.toString()
          )
          .filter(
            Boolean
          )
      ),
    ]

    /**
     * LessonNote IDs are stored
     * inside PayoutLog.courseId
     * for lesson-note purchases.
     */
    const lessonNoteIds = [
      ...new Set(
        logs
          .filter(
            (
              log: any
            ) =>
              log.sourceModel ===
              'LessonNotePurchase'
          )
          .map(
            (
              log: any
            ) =>
              log.courseId?.toString()
          )
          .filter(
            Boolean
          )
      ),
    ]

    /**
     * LessonNotePurchase IDs
     */
    const purchaseIds = [
      ...new Set(
        logs
          .filter(
            (
              log: any
            ) =>
              log.sourceModel ===
              'LessonNotePurchase'
          )
          .map(
            (
              log: any
            ) =>
              log.purchaseId?.toString()
          )
          .filter(
            Boolean
          )
      ),
    ]

    /**
     * ======================================================
     * FETCH RELATED RECORDS
     * ======================================================
     */

    const [
      tutors,
      regularStudents,
      selfPacedStudents,
      regularCourses,
      selfPacedCourses,
      lessonNotes,
      lessonNotePurchases,
    ] =
      await Promise.all([
        /**
         * Tutors
         */
        Tutor.find({
          _id: {
            $in:
              tutorIds,
          },
        })
          .select(
            [
              'firstName',
              'lastName',
              'email',
              'phone',
              'bankDetails',
              'status',
            ].join(' ')
          )
          .lean(),

        /**
         * Regular students
         */
        Student.find({
          _id: {
            $in:
              regularStudentIds,
          },
        })
          .select(
            'firstName lastName email'
          )
          .lean(),

        /**
         * Self-paced students
         */
        SelfPacedStudent.find({
          _id: {
            $in:
              selfPacedStudentIds,
          },
        })
          .select(
            'firstName lastName email'
          )
          .lean(),

        /**
         * Regular courses
         */
        Course.find({
          _id: {
            $in:
              regularCourseIds,
          },
        })
          .select(
            'name title'
          )
          .lean(),

        /**
         * Self-paced courses
         */
        SelfPacedCourse.find({
          _id: {
            $in:
              selfPacedCourseIds,
          },
        })
          .select(
            'title name'
          )
          .lean(),

        /**
         * Lesson notes
         */
        LessonNote.find({
          _id: {
            $in:
              lessonNoteIds,
          },
        })
          .select(
            'title'
          )
          .lean(),

        /**
         * Lesson-note purchases
         */
        LessonNotePurchase.find({
          _id: {
            $in:
              purchaseIds,
          },
        })
          .select(
            [
              'buyerName',
              'buyerEmail',
              'paystackReference',
            ].join(' ')
          )
          .lean(),
      ])

    /**
     * ======================================================
     * MAPS
     * ======================================================
     */

    const tutorById =
      new Map(
        tutors.map(
          (
            tutor: any
          ) => [
            tutor._id.toString(),
            tutor,
          ]
        )
      )

    const regularStudentById =
      new Map(
        regularStudents.map(
          (
            student: any
          ) => [
            student._id.toString(),
            student,
          ]
        )
      )

    const selfPacedStudentById =
      new Map(
        selfPacedStudents.map(
          (
            student: any
          ) => [
            student._id.toString(),
            student,
          ]
        )
      )

    const regularCourseById =
      new Map(
        regularCourses.map(
          (
            course: any
          ) => [
            course._id.toString(),
            course,
          ]
        )
      )

    const selfPacedCourseById =
      new Map(
        selfPacedCourses.map(
          (
            course: any
          ) => [
            course._id.toString(),
            course,
          ]
        )
      )

    const lessonNoteById =
      new Map(
        lessonNotes.map(
          (
            note: any
          ) => [
            note._id.toString(),
            note,
          ]
        )
      )

    const lessonNotePurchaseById =
      new Map(
        lessonNotePurchases.map(
          (
            purchase: any
          ) => [
            purchase._id.toString(),
            purchase,
          ]
        )
      )

    /**
     * ======================================================
     * FORMAT PAYOUTS
     * ======================================================
     */

    const payouts =
      logs.map(
        (
          log: any
        ) => {
          const tutor =
            tutorById.get(
              log.tutorId?.toString()
            )

          const studentId =
            log.studentId?.toString()

          const itemId =
            log.courseId?.toString()

          let studentName =
            'Unknown Student'

          let studentEmail:
            string | null =
            null

          let itemName =
            'Unknown Item'

          let paystackReference:
            string | null =
            null

          /**
           * =================================================
           * REGULAR COURSE ENROLLMENT
           * =================================================
           */

          if (
            log.sourceModel ===
            'Payment'
          ) {
            if (
              studentId
            ) {
              const student =
                regularStudentById.get(
                  studentId
                )

              if (
                student
              ) {
                studentName =
                  `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                  'Unknown Student'

                studentEmail =
                  student.email ||
                  null
              }
            }

            if (
              itemId
            ) {
              const course =
                regularCourseById.get(
                  itemId
                )

              if (
                course
              ) {
                itemName =
                  course.name ||
                  course.title ||
                  'Unknown Course'
              }
            }
          }

          /**
           * =================================================
           * SELF-PACED COURSE PURCHASE
           * =================================================
           */

          else if (
            log.sourceModel ===
            'SelfPacedEnrollment'
          ) {
            if (
              studentId
            ) {
              const student =
                selfPacedStudentById.get(
                  studentId
                )

              if (
                student
              ) {
                studentName =
                  `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                  'Unknown Student'

                studentEmail =
                  student.email ||
                  null
              }
            }

            if (
              itemId
            ) {
              const course =
                selfPacedCourseById.get(
                  itemId
                )

              if (
                course
              ) {
                itemName =
                  course.title ||
                  course.name ||
                  'Unknown Self-Paced Course'
              }
            }
          }

          /**
           * =================================================
           * COACHING SESSION
           * =================================================
           */

          else if (
            log.sourceModel ===
            'CoachingBooking'
          ) {
            if (
              studentId
            ) {
              const student =
                selfPacedStudentById.get(
                  studentId
                )

              if (
                student
              ) {
                studentName =
                  `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                  'Unknown Student'

                studentEmail =
                  student.email ||
                  null
              }
            }

            if (
              itemId
            ) {
              const course =
                selfPacedCourseById.get(
                  itemId
                )

              if (
                course
              ) {
                itemName =
                  course.title ||
                  course.name ||
                  'Unknown Self-Paced Course'
              }
            }
          }

          /**
           * =================================================
           * LESSON NOTE
           * =================================================
           */

          else if (
            log.sourceModel ===
            'LessonNotePurchase'
          ) {
            const purchaseId =
              log.purchaseId?.toString()

            if (
              purchaseId
            ) {
              const purchase =
                lessonNotePurchaseById.get(
                  purchaseId
                )

              if (
                purchase
              ) {
                studentName =
                  purchase.buyerName ||
                  'Anonymous Buyer'

                studentEmail =
                  purchase.buyerEmail ||
                  null

                paystackReference =
                  purchase.paystackReference ||
                  null
              }
            }

            if (
              itemId
            ) {
              const note =
                lessonNoteById.get(
                  itemId
                )

              if (
                note
              ) {
                itemName =
                  note.title ||
                  'Lesson Note'
              }
            }
          }

          /**
           * =================================================
           * TUTOR DETAILS
           * =================================================
           */

          const tutorName =
            tutor
              ? `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() ||
                'Tutor'
              : 'Unknown Tutor'

          /**
           * =================================================
           * RETURN ROW
           * =================================================
           */

          return {
            _id:
              log._id.toString(),

            sourceModel:
              log.sourceModel,

            sourceLabel:
              getSourceLabel(
                log.sourceModel
              ),

            /**
             * Keep both names so an existing
             * frontend using courseName continues
             * to work.
             */
            itemName,

            courseName:
              itemName,

            /**
             * Student / buyer
             */
            studentName,

            studentEmail,

            /**
             * Tutor
             */
            tutorId:
              log.tutorId?.toString(),

            tutorName,

            tutorEmail:
              tutor?.email ||
              null,

            tutorPhone:
              tutor?.phone ||
              null,

            tutorStatus:
              tutor?.status ||
              null,

            /**
             * Correct Tutor.bankDetails structure
             */
            bankName:
              tutor?.bankDetails
                ?.bankName ||
              null,

            bankCode:
              tutor?.bankDetails
                ?.bankCode ||
              null,

            accountNumber:
              tutor?.bankDetails
                ?.accountNumber ||
              null,

            accountName:
              tutor?.bankDetails
                ?.accountName ||
              null,

            paystackRecipientCode:
              tutor?.bankDetails
                ?.paystackRecipientCode ||
              null,

            /**
             * Amounts
             */
            grossAmount:
              Number(
                log.grossAmount ||
                  0
              ),

            commissionRate:
              Number(
                log.commissionRate ||
                  0
              ),

            commissionAmount:
              Number(
                log.commissionAmount ||
                  0
              ),

            netAmount:
              Number(
                log.netAmount ||
                  0
              ),

            /**
             * Payout state
             */
            status:
              log.status,

            failureReason:
              log.failureReason ||
              null,

            paidAt:
              log.paidAt ||
              null,

            createdAt:
              log.createdAt,

            updatedAt:
              log.updatedAt,

            /**
             * Purchase reference.
             *
             * Lesson notes expose it here.
             */
            paystackReference,

            /**
             * These are kept for future
             * automated Paystack Transfers.
             */
            paystackTransferReference:
              log.paystackTransferReference ||
              null,

            paystackTransferCode:
              log.paystackTransferCode ||
              null,
          }
        }
      )

    /**
     * ======================================================
     * COUNTS
     * ======================================================
     *
     * Counts are global, not restricted to the
     * selected tab/status.
     */

    const [
      allCount,
      pendingCount,
      processingCount,
      paidCount,
      failedCount,
    ] =
      await Promise.all([
        PayoutLog.countDocuments(
          {}
        ),

        PayoutLog.countDocuments({
          status:
            'pending',
        }),

        PayoutLog.countDocuments({
          status:
            'processing',
        }),

        PayoutLog.countDocuments({
          status:
            'paid',
        }),

        PayoutLog.countDocuments({
          status:
            'failed',
        }),
      ])

    /**
     * ======================================================
     * FINANCIAL TOTALS
     * ======================================================
     */

    const totals =
      await PayoutLog.aggregate([
        {
          $group: {
            _id:
              null,

            /**
             * All valid source sales represented
             * by payout logs.
             */
            totalGross: {
              $sum:
                '$grossAmount',
            },

            totalCommission: {
              $sum:
                '$commissionAmount',
            },

            /**
             * What tutors have already received.
             */
            totalPaid: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$status',
                      'paid',
                    ],
                  },

                  '$netAmount',

                  0,
                ],
              },
            },

            /**
             * What is currently owed /
             * being processed.
             */
            totalPending: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      [
                        'pending',
                        'processing',
                      ],
                    ],
                  },

                  '$netAmount',

                  0,
                ],
              },
            },

            /**
             * Value currently marked failed.
             */
            totalFailed: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$status',
                      'failed',
                    ],
                  },

                  '$netAmount',

                  0,
                ],
              },
            },
          },
        },
      ])

    const summary =
      totals[0] ||
      {
        totalGross:
          0,

        totalCommission:
          0,

        totalPaid:
          0,

        totalPending:
          0,

        totalFailed:
          0,
      }

    /**
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json({
      payouts,

      counts: {
        all:
          allCount,

        pending:
          pendingCount,

        processing:
          processingCount,

        paid:
          paidCount,

        failed:
          failedCount,
      },

      totals: {
        totalGross:
          Number(
            summary.totalGross ||
              0
          ),

        totalCommission:
          Number(
            summary.totalCommission ||
              0
          ),

        totalPaid:
          Number(
            summary.totalPaid ||
              0
          ),

        totalPending:
          Number(
            summary.totalPending ||
              0
          ),

        totalFailed:
          Number(
            summary.totalFailed ||
              0
          ),
      },
    })
  } catch (
    error: any
  ) {
    console.error(
      '[ADMIN PAYOUTS GET ERROR]',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to fetch payouts',
      },
      {
        status: 500,
      }
    )
  }
}