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
      status: 'active' as const,
    })
      .select('courseId tutorId')
      .lean()

    const courseIds = enrollments.map((e: any) => e.courseId)
    const now = new Date()

    const exams = await Exam.find({
      courseId: { $in: courseIds },
      isPublished: true,
      $or: [
        { scheduledDate: { $lte: now } },
        { scheduledDate: null },
        { scheduledDate: { $exists: false } },
      ],
    })
      .populate({ path: 'courseId', select: 'name category' })
      .populate({ path: 'tutorId', select: 'firstName lastName' })
      .select('title courseId tutorId duration instructions scheduledDate questions')
      .lean()

    // Check which exams have been taken
    const grades = await Grade.find({
      studentId: student._id,
      examId: { $in: exams.map((ex: any) => ex._id) },
    })
      .select('examId score total percentage gradedAt')
      .lean()

    const gradeByExam = new Map(
      grades.map((g: any) => [g.examId?.toString(), g])
    )

    const formattedExams = exams.map((ex: any) => {
      const grade = gradeByExam.get(ex._id.toString())
      return {
        _id: ex._id.toString(),
        title: ex.title,
        courseName: ex.courseId?.name ?? '',
        courseCategory: ex.courseId?.category ?? '',
        tutorName: ex.tutorId
          ? `${ex.tutorId.firstName} ${ex.tutorId.lastName}`
          : '',
        duration: ex.duration,
        instructions: ex.instructions ?? '',
        scheduledDate: ex.scheduledDate ?? null,
        questionCount: ex.questions?.length ?? 0,
        taken: !!grade,
        grade: grade
          ? {
              score: (grade as any).score,
              total: (grade as any).total,
              percentage:
                (grade as any).total > 0
                  ? Math.round(
                      ((grade as any).score / (grade as any).total) * 100
                    )
                  : 0,
              gradedAt: (grade as any).gradedAt,
            }
          : null,
      }
    })

    const upcoming = formattedExams.filter(e => !e.taken)
    const completed = formattedExams.filter(e => e.taken)

    return NextResponse.json({ upcoming, completed })
  } catch (error: any) {
    console.error('Student exams error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}