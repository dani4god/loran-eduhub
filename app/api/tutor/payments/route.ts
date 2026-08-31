// app/api/tutor/payments/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getServerSession,
} from 'next-auth'

import {
  authOptions,
} from '@/lib/auth'

import connectDB from '@/lib/mongodb'

import Tutor from '@/models/Tutor'
import PayoutLog from '@/models/PayoutLog'

import Student from '@/models/Student'
import SelfPacedStudent from '@/models/SelfPacedStudent'

import Course from '@/models/Course'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import LessonNote from '@/models/LessonNote'
import LessonNotePurchase from '@/models/LessonNotePurchase'

import {
  ensureAllPayoutLogs,
} from '@/lib/payout'

export async function GET(
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
        'tutor'
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

    const tutor =
      await Tutor.findOne({
        userId:
          session.user.id,
      }).lean()

    if (!tutor) {
      return NextResponse.json(
        {
          error:
            'Tutor not found',
        },
        {
          status: 404,
        }
      )
    }

    /**
     * Make sure anything not previously
     * logged gets reconciled.
     */
    await ensureAllPayoutLogs()

    const {
      searchParams,
    } =
      new URL(
        req.url
      )

    const requestedPage =
      Number(
        searchParams.get(
          'page'
        )
      ) || 1

    const requestedLimit =
      Number(
        searchParams.get(
          'limit'
        )
      ) || 20

    const page =
      Math.max(
        1,
        requestedPage
      )

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          requestedLimit
        )
      )

    const payoutFilter = {
      tutorId:
        tutor._id,
    }

    const [
      totalCount,
      pendingCount,
      processingCount,
      paidCount,
      failedCount,
    ] =
      await Promise.all([
        PayoutLog.countDocuments(
          payoutFilter
        ),

        PayoutLog.countDocuments({
          ...payoutFilter,
          status:
            'pending',
        }),

        PayoutLog.countDocuments({
          ...payoutFilter,
          status:
            'processing',
        }),

        PayoutLog.countDocuments({
          ...payoutFilter,
          status:
            'paid',
        }),

        PayoutLog.countDocuments({
          ...payoutFilter,
          status:
            'failed',
        }),
      ])

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalCount /
            limit
        )
      )

    const safePage =
      Math.min(
        page,
        totalPages
      )

    const skip =
      (
        safePage -
        1
      ) *
      limit

    const logs =
      await PayoutLog.find(
        payoutFilter
      )
        .sort({
          createdAt:
            -1,
        })
        .skip(
          skip
        )
        .limit(
          limit
        )
        .lean()

    /**
     * ======================================================
     * IDs
     * ======================================================
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
     * RELATED RECORDS
     * ======================================================
     */

    const [
      students,
      selfPacedStudents,
      courses,
      selfPacedCourses,
      lessonNotes,
      lessonNotePurchases,
    ] =
      await Promise.all([
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

        LessonNotePurchase.find({
          _id: {
            $in:
              purchaseIds,
          },
        })
          .select(
            'buyerName buyerEmail paystackReference'
          )
          .lean(),
      ])

    /**
     * ======================================================
     * MAPS
     * ======================================================
     */

    const studentById =
      new Map(
        students.map(
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

    const courseById =
      new Map(
        courses.map(
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

    const purchaseById =
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
     * FORMAT
     * ======================================================
     */

    const results =
      logs.map(
        (
          log: any
        ) => {
          let studentName =
            'Unknown Student'

          let studentEmail:
            string | null =
            null

          let courseName =
            'Unknown Item'

          let paystackReference:
            string | null =
            null

          const studentId =
            log.studentId?.toString()

          const courseId =
            log.courseId?.toString()

          /**
           * -----------------------------------------------
           * REGULAR COURSE
           * -----------------------------------------------
           */
          if (
            log.sourceModel ===
            'Payment'
          ) {
            if (
              studentId
            ) {
              const student =
                studentById.get(
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
              courseId
            ) {
              const course =
                courseById.get(
                  courseId
                )

              if (
                course
              ) {
                courseName =
                  course.name ||
                  course.title ||
                  'Unknown Course'
              }
            }
          }

          /**
           * -----------------------------------------------
           * SELF-PACED COURSE PURCHASE
           * -----------------------------------------------
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
              courseId
            ) {
              const course =
                selfPacedCourseById.get(
                  courseId
                )

              if (
                course
              ) {
                courseName =
                  course.title ||
                  course.name ||
                  'Unknown Self-Paced Course'
              }
            }
          }

          /**
           * -----------------------------------------------
           * COACHING
           * -----------------------------------------------
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
              courseId
            ) {
              const course =
                selfPacedCourseById.get(
                  courseId
                )

              if (
                course
              ) {
                courseName =
                  course.title ||
                  course.name ||
                  'Unknown Self-Paced Course'
              }
            }
          }

          /**
           * -----------------------------------------------
           * LESSON NOTE
           * -----------------------------------------------
           */
          else if (
            log.sourceModel ===
            'LessonNotePurchase'
          ) {
            const purchase =
              purchaseById.get(
                log.purchaseId?.toString()
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

            if (
              courseId
            ) {
              const note =
                lessonNoteById.get(
                  courseId
                )

              if (
                note
              ) {
                courseName =
                  note.title ||
                  'Lesson Note'
              }
            }
          }

          return {
            _id:
              log._id.toString(),

            sourceModel:
              log.sourceModel,

            studentName,

            studentEmail,

            courseName,

            grossAmount:
              Number(
                log.grossAmount ||
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

            status:
              log.status,

            paidAt:
              log.paidAt ||
              null,

            createdAt:
              log.createdAt,

            paystackReference,
          }
        }
      )

    /**
     * ======================================================
     * SUMMARY FROM ALL PAYOUTS
     * ======================================================
     */

    const financialTotals =
      await PayoutLog.aggregate([
        {
          $match: {
            tutorId:
              tutor._id,
          },
        },

        {
          $group: {
            _id:
              null,

            totalGross: {
              $sum:
                '$grossAmount',
            },

            totalCommission: {
              $sum:
                '$commissionAmount',
            },

            totalEarned: {
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
          },
        },
      ])

    const summary =
      financialTotals[0] ||
      {
        totalGross:
          0,

        totalCommission:
          0,

        totalEarned:
          0,

        totalPending:
          0,
      }

    return NextResponse.json({
      payments:
        results,

      totalEarned:
        Number(
          summary.totalEarned ||
            0
        ),

      totalPending:
        Number(
          summary.totalPending ||
            0
        ),

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

      counts: {
        all:
          totalCount,

        pending:
          pendingCount,

        processing:
          processingCount,

        paid:
          paidCount,

        failed:
          failedCount,
      },

      pagination: {
        page:
          safePage,

        limit,

        totalCount,

        totalPages,

        hasNextPage:
          safePage <
          totalPages,

        hasPreviousPage:
          safePage >
          1,
      },
    })
  } catch (
    error
  ) {
    console.error(
      '[TUTOR PAYMENTS ERROR]',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to fetch tutor payments',
      },
      {
        status: 500,
      }
    )
  }
}