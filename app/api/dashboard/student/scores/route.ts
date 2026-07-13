import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Grade from '@/models/Grade'
import Exam from '@/models/Exam'
import Assignment from '@/models/Assignment'
import AssignmentSubmission from '@/models/AssignmentSubmission'

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
      status: { $in: ['active', 'expired', 'paused'] as const },
    })
      .populate({ path: 'courseId', select: 'name category' })
      .populate({ path: 'tutorId', select: 'firstName lastName' })
      .lean()

    const result = await Promise.all(
      enrollments.map(async (e: any) => {
        const courseId = e.courseId?._id

        // Exam grades for this course
        const grades = await Grade.find({
          studentId: student._id,
          courseId,
        })
          .lean()

        // Get exam titles
        const examIds = grades.map((g: any) => g.examId)
        const exams = await Exam.find({ _id: { $in: examIds } })
          .select('title')
          .lean()
        const examById = new Map(
          exams.map((ex: any) => [ex._id.toString(), ex])
        )

        // Assignment scores for this course
        const submissions = await AssignmentSubmission.find({
          studentId: student._id,
          courseId,
          status: 'graded',
        })
          .lean()

        const assignmentIds = submissions.map((s: any) => s.assignmentId)
        const assignments = await Assignment.find({
          _id: { $in: assignmentIds },
        })
          .select('title totalScore')
          .lean()
        const assignmentById = new Map(
          assignments.map((a: any) => [a._id.toString(), a])
        )

        const examScores = grades.map((g: any) => ({
          type: 'exam' as const,
          title: examById.get(g.examId?.toString())?.title ?? 'Exam',
          score: g.score,
          total: g.total,
          percentage: g.percentage,
          date: g.gradedAt,
          feedback: g.feedback ?? '',
        }))

        const assignmentScores = submissions.map((s: any) => {
          const assignment = assignmentById.get(s.assignmentId?.toString())
          return {
            type: 'assignment' as const,
            title: assignment?.title ?? 'Assignment',
            score: s.score,
            total: assignment?.totalScore ?? 0,
            percentage:
              assignment?.totalScore > 0
                ? Math.round((s.score / assignment.totalScore) * 100)
                : 0,
            date: s.gradedAt,
            feedback: s.feedback ?? '',
          }
        })

        const allScores = [...examScores, ...assignmentScores].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        const totalItems = allScores.length
        const avgScore =
          totalItems > 0
            ? Math.round(
                allScores.reduce((acc, s) => acc + s.percentage, 0) / totalItems
              )
            : null

        return {
          courseId: courseId?.toString(),
          courseName: e.courseId?.name ?? '',
          courseCategory: e.courseId?.category ?? '',
          tutorName: e.tutorId
            ? `${e.tutorId.firstName} ${e.tutorId.lastName}`
            : '',
          plan: e.plan,
          status: e.status,
          scores: allScores,
          stats: {
            totalExams: examScores.length,
            totalAssignments: assignmentScores.length,
            avgScore,
            highestScore:
              allScores.length > 0
                ? Math.max(...allScores.map(s => s.percentage))
                : null,
            lowestScore:
              allScores.length > 0
                ? Math.min(...allScores.map(s => s.percentage))
                : null,
          },
        }
      })
    )

    const overallAvg =
      result.filter(c => c.stats.avgScore !== null).length > 0
        ? Math.round(
            result
              .filter(c => c.stats.avgScore !== null)
              .reduce((acc, c) => acc + (c.stats.avgScore ?? 0), 0) /
              result.filter(c => c.stats.avgScore !== null).length
          )
        : null

    return NextResponse.json({ courses: result, overallAvg })
  } catch (error: any) {
    console.error('Student scores error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}