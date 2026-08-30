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

export async function GET(
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
    // CREATE ANY MISSING PAYOUT LOGS
    // ========================================================

    await ensureAllPayoutLogs()

    // ========================================================
    // FILTER
    // ========================================================

    const {
      searchParams,
    } =
      new URL(
        req.url
      )

    const status =
      searchParams.get(
        'status'
      ) ||
      'pending'

    const allowedStatuses =
      [
        'pending',
        'processing',
        'paid',
        'failed',
        'all',
      ]

    if (
      !allowedStatuses.includes(
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

    const query =
      status ===
      'all'
        ? {}
        : {
            status:
              status as
                | 'pending'
                | 'processing'
                | 'paid'
                | 'failed',
          }

    const logs =
      await PayoutLog.find(
        query
      )
        .sort({
          createdAt:
            -1,
        })
        .limit(500)
        .lean()

    // ========================================================
    // IDS
    // ========================================================

    const tutorIds = [
      ...new Set(
        logs
          .map(
            (log: any) =>
              log.tutorId?.toString()
          )
          .filter(Boolean)
      ),
    ]

    const regularStudentIds = [
      ...new Set(
        logs
          .filter(
            (log: any) =>
              log.sourceModel ===
                'Payment' &&
              log.studentId
          )
          .map(
            (log: any) =>
              log.studentId.toString()
          )
      ),
    ]

    const selfPacedStudentIds = [
      ...new Set(
        logs
          .filter(
            (log: any) =>
              log.sourceModel ===
                'CoachingBooking' &&
              log.studentId
          )
          .map(
            (log: any) =>
              log.studentId.toString()
          )
      ),
    ]

    const regularCourseIds = [
      ...new Set(
        logs
          .filter(
            (log: any) =>
              log.sourceModel ===
              'Payment'
          )
          .map(
            (log: any) =>
              log.courseId?.toString()
          )
          .filter(Boolean)
      ),
    ]

    const selfPacedCourseIds = [
      ...new Set(
        logs
          .filter(
            (log: any) =>
              log.sourceModel ===
              'CoachingBooking'
          )
          .map(
            (log: any) =>
              log.courseId?.toString()
          )
          .filter(Boolean)
      ),
    ]

    const lessonNoteIds = [
      ...new Set(
        logs
          .filter(
            (log: any) =>
              log.sourceModel ===
              'LessonNotePurchase'
          )
          .map(
            (log: any) =>
              log.courseId?.toString()
          )
          .filter(Boolean)
      ),
    ]

    const purchaseIds = [
      ...new Set(
        logs
          .filter(
            (log: any) =>
              log.sourceModel ===
                'LessonNotePurchase' &&
              log.purchaseId
          )
          .map(
            (log: any) =>
              log.purchaseId.toString()
          )
      ),
    ]

    // ========================================================
    // FETCH RELATED DATA
    // ========================================================

    const [
      tutors,
      students,
      selfPacedStudents,
      courses,
      selfPacedCourses,
      lessonNotes,
      lessonNotePurchases,
    ] =
      await Promise.all([
        Tutor.find({
          _id: {
            $in:
              tutorIds,
          },
        })
          .select(
            'firstName lastName bankDetails'
          )
          .lean(),

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

    // ========================================================
    // MAPS
    // ========================================================

    const tutorById =
      new Map(
        tutors.map(
          (tutor: any) => [
            tutor._id.toString(),
            tutor,
          ]
        )
      )

    const studentById =
      new Map(
        students.map(
          (student: any) => [
            student._id.toString(),
            student,
          ]
        )
      )

    const selfPacedStudentById =
      new Map(
        selfPacedStudents.map(
          (student: any) => [
            student._id.toString(),
            student,
          ]
        )
      )

    const courseById =
      new Map(
        courses.map(
          (course: any) => [
            course._id.toString(),
            course,
          ]
        )
      )

    const selfPacedCourseById =
      new Map(
        selfPacedCourses.map(
          (course: any) => [
            course._id.toString(),
            course,
          ]
        )
      )

    const lessonNoteById =
      new Map(
        lessonNotes.map(
          (note: any) => [
            note._id.toString(),
            note,
          ]
        )
      )

    const purchaseById =
      new Map(
        lessonNotePurchases.map(
          (purchase: any) => [
            purchase._id.toString(),
            purchase,
          ]
        )
      )

    // ========================================================
    // SERIALIZE
    // ========================================================

    const results =
      logs.map(
        (log: any) => {
          const tutor =
            tutorById.get(
              log.tutorId?.toString()
            )

          let studentName =
            'Unknown Student'

          let studentEmail:
            string | null =
            null

          let itemName =
            'Unknown Item'

          let sourceLabel =
            'Course Enrollment'

          let paystackReference:
            string | null =
            null

          // ==================================================
          // PAYMENT
          // ==================================================

          if (
            log.sourceModel ===
            'Payment'
          ) {
            const student =
              log.studentId
                ? studentById.get(
                    log.studentId.toString()
                  )
                : null

            if (student) {
              studentName =
                `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                'Unknown Student'

              studentEmail =
                student.email ||
                null
            }

            const course =
              courseById.get(
                log.courseId?.toString()
              )

            itemName =
              course?.name ||
              course?.title ||
              'Unknown Course'

            sourceLabel =
              'Course Enrollment'
          }

          // ==================================================
          // COACHING
          // ==================================================

          if (
            log.sourceModel ===
            'CoachingBooking'
          ) {
            const student =
              log.studentId
                ? selfPacedStudentById.get(
                    log.studentId.toString()
                  )
                : null

            if (student) {
              studentName =
                `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                'Unknown Student'

              studentEmail =
                student.email ||
                null
            }

            const course =
              selfPacedCourseById.get(
                log.courseId?.toString()
              )

            itemName =
              course?.title ||
              course?.name ||
              'Unknown Self-Paced Course'

            sourceLabel =
              'Coaching Session'
          }

          // ==================================================
          // LESSON NOTE
          // ==================================================

          if (
            log.sourceModel ===
            'LessonNotePurchase'
          ) {
            const purchase =
              log.purchaseId
                ? purchaseById.get(
                    log.purchaseId.toString()
                  )
                : null

            studentName =
              purchase?.buyerName ||
              'Anonymous Buyer'

            studentEmail =
              purchase?.buyerEmail ||
              null

            paystackReference =
              purchase?.paystackReference ||
              null

            const note =
              lessonNoteById.get(
                log.courseId?.toString()
              )

            itemName =
              note?.title ||
              'Unknown Lesson Note'

            sourceLabel =
              'Lesson Note Purchase'
          }

          return {
            _id:
              log._id.toString(),

            sourceModel:
              log.sourceModel,

            sourceLabel,

            tutorId:
              log.tutorId.toString(),

            tutorName:
              tutor
                ? `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim()
                : 'Unknown Tutor',

            bankName:
              tutor?.bankDetails
                ?.bankName ||
              null,

            accountNumber:
              tutor?.bankDetails
                ?.accountNumber ||
              null,

            accountName:
              tutor?.bankDetails
                ?.accountName ||
              null,

            hasBankDetails:
              Boolean(
                tutor
                  ?.bankDetails
                  ?.accountNumber
              ),

            studentName,

            studentEmail,

            courseName:
              itemName,

            itemName,

            grossAmount:
              Number(
                log.grossAmount
              ),

            commissionRate:
              Number(
                log.commissionRate
              ),

            commissionAmount:
              Number(
                log.commissionAmount
              ),

            netAmount:
              Number(
                log.netAmount
              ),

            status:
              log.status,

            failureReason:
              log.failureReason ||
              null,

            paystackReference,

            paidAt:
              log.paidAt ||
              null,

            createdAt:
              log.createdAt,
          }
        }
      )

    // ========================================================
    // STATUS COUNTS
    // ========================================================

    const [
      pendingCount,
      processingCount,
      paidCount,
      failedCount,
    ] =
      await Promise.all([
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

    return NextResponse.json({
      payouts:
        results,

      statusCounts: {
        pending:
          pendingCount,

        processing:
          processingCount,

        paid:
          paidCount,

        failed:
          failedCount,
      },
    })
  } catch (error) {
    console.error(
      '[ADMIN PAYOUTS GET ERROR]',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load payouts',
      },
      {
        status: 500,
      }
    )
  }
}