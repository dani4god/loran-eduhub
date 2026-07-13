import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Exam from '@/models/Exam'
import Grade from '@/models/Grade'

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
      status: { $in: ['active', 'paused', 'expired'] as const },
    })
      .populate({ path: 'courseId', select: 'name category description syllabus' })
      .populate({ path: 'tutorId', select: 'firstName lastName profileImage bio' })
      .sort({ createdAt: -1 })
      .lean()

    const now = new Date()

    const courseData = await Promise.all(
      enrollments.map(async (e: any) => {
        const courseId = e.courseId?._id
        const enrollmentId = e._id

        // Exams for this course
        const exams = await Exam.find({
          courseId,
          isPublished: true,
        })
          .select('_id title duration scheduledDate')
          .lean()

        // Grades for this student in this course
        const grades = await Grade.find({
          studentId: student._id,
          courseId,
        })
          .select('examId score total gradedAt')
          .lean()

        const takenExamIds = new Set(
          grades.map((g: any) => g.examId?.toString())
        )

        const totalExams = exams.length
        const examsTaken = grades.length
        const examProgress =
          totalExams > 0 ? Math.round((examsTaken / totalExams) * 100) : 0

        // Days-based progress
        const startDate = new Date(e.startDate)
        const endDate = new Date(e.endDate)
        const totalDays = Math.max(
          1,
          Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)
        )
        const daysElapsed = Math.min(
          totalDays,
          Math.max(
            0,
            Math.floor((now.getTime() - startDate.getTime()) / 86400000)
          )
        )
        const timeProgress = Math.round((daysElapsed / totalDays) * 100)

        // Average score for this course
        const avgScore =
          grades.length > 0
            ? Math.round(
                grades.reduce(
                  (acc: number, g: any) =>
                    acc + (g.total > 0 ? (g.score / g.total) * 100 : 0),
                  0
                ) / grades.length
              )
            : null

        return {
          enrollmentId: enrollmentId.toString(),
          courseId: courseId?.toString(),
          courseName: e.courseId?.name ?? 'Unknown Course',
          courseCategory: e.courseId?.category ?? '',
          courseDescription: e.courseId?.description ?? '',
          syllabus: e.courseId?.syllabus ?? [],
          tutorId: e.tutorId?._id?.toString(),
          tutorName: e.tutorId
            ? `${e.tutorId.firstName} ${e.tutorId.lastName}`
            : 'Unknown Tutor',
          tutorImage: e.tutorId?.profileImage ?? null,
          tutorBio: e.tutorId?.bio ?? '',
          plan: e.plan,
          status: e.status,
          startDate: e.startDate,
          endDate: e.endDate,
          daysElapsed,
          totalDays,
          timeProgress,
          totalExams,
          examsTaken,
          examProgress,
          avgScore,
          upcomingExams: exams
            .filter((ex: any) => !takenExamIds.has(ex._id.toString()))
            .map((ex: any) => ({
              _id: ex._id.toString(),
              title: ex.title,
              duration: ex.duration,
              scheduledDate: ex.scheduledDate ?? null,
            })),
          recentGrades: grades.slice(0, 3).map((g: any) => ({
            _id: g._id.toString(),
            score: g.score,
            total: g.total,
            percentage:
              g.total > 0 ? Math.round((g.score / g.total) * 100) : 0,
            gradedAt: g.gradedAt,
          })),
        }
      })
    )

    return NextResponse.json({ courses: courseData })
  } catch (error: any) {
    console.error('Student courses error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}