import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Assignment from '@/models/Assignment'
import AssignmentSubmission from '@/models/AssignmentSubmission'
import Enrollment from '@/models/Enrollment'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'active' as const,
    })
      .select('courseId tutorId')
      .lean()

    // Map courseId -> enrollmentId so each assignment's submission lookup
    // below is scoped to the CURRENT enrollment for that course, not any
    // historical one.
    const enrollmentByCourseId = new Map(
      enrollments.map((e: any) => [e.courseId.toString(), e._id.toString()])
    )

    const courseIds = enrollments.map((e: any) => e.courseId)

    const assignments = await Assignment.find({
      courseId: { $in: courseIds },
      isPublished: true,
    })
      .populate({ path: 'courseId', select: 'name category' })
      .populate({ path: 'tutorId', select: 'firstName lastName' })
      .sort({ createdAt: -1 })
      .lean()

    const submissions = await AssignmentSubmission.find({
      studentId: student._id,
      assignmentId: { $in: assignments.map((a: any) => a._id) },
      enrollmentId: { $in: enrollments.map((e: any) => e._id) },
    }).lean()

    const submissionByAssignment = new Map(
      submissions.map((s: any) => [s.assignmentId.toString(), s])
    )

    const formatted = assignments.map((a: any) => {
      const submission = submissionByAssignment.get(a._id.toString())
      const now = new Date()
      const isOverdue = a.dueDate && new Date(a.dueDate) < now && !submission

      return {
        _id: a._id.toString(),
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        totalScore: a.totalScore,
        dueDate: a.dueDate ?? null,
        courseName: a.courseId?.name ?? '',
        courseCategory: a.courseId?.category ?? '',
        courseId: a.courseId?._id?.toString() ?? '',
        tutorName: a.tutorId
          ? `${a.tutorId.firstName} ${a.tutorId.lastName}`
          : '',
        tutorId: a.tutorId?._id?.toString() ?? '',
        isOverdue,
        submission: submission
          ? {
              _id: (submission as any)._id.toString(),
              submittedAt: (submission as any).submittedAt,
              status: (submission as any).status,
              score: (submission as any).score ?? null,
              feedback: (submission as any).feedback ?? '',
              gradedAt: (submission as any).gradedAt ?? null,
              percentage:
                (submission as any).score != null
                  ? Math.round(
                      ((submission as any).score / a.totalScore) * 100
                    )
                  : null,
            }
          : null,
      }
    })

    const pending = formatted.filter(a => !a.submission)
    const submitted = formatted.filter(
      a => a.submission?.status === 'submitted'
    )
    const graded = formatted.filter(a => a.submission?.status === 'graded')

    return NextResponse.json({ assignments: formatted, pending, submitted, graded })
  } catch (error: any) {
    console.error('Student assignments error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}