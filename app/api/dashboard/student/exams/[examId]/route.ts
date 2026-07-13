import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Exam from '@/models/Exam'
import Question from '@/models/Question'
import Grade from '@/models/Grade'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const exam = await Exam.findById(examId)
      .populate({ path: 'courseId', select: 'name category' })
      .populate({ path: 'tutorId', select: 'firstName lastName' })
      .lean() as any

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Verify student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      studentId: student._id,
      courseId: exam.courseId?._id,
      status: 'active' as const,
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Check if already taken
    const existingGrade = await Grade.findOne({
      studentId: student._id,
      examId,
    })

    if (existingGrade) {
      return NextResponse.json(
        { error: 'You have already taken this exam', alreadyTaken: true },
        { status: 400 }
      )
    }

    // Fetch questions (hide correct answers)
    const questions = await Question.find({
      examId,
    })
      .select('type questionText options marks imageUrl')
      .lean()

    return NextResponse.json({
      exam: {
        _id: exam._id.toString(),
        title: exam.title,
        instructions: exam.instructions ?? '',
        duration: exam.duration,
        courseName: exam.courseId?.name ?? '',
        tutorName: exam.tutorId
          ? `${exam.tutorId.firstName} ${exam.tutorId.lastName}`
          : '',
        questionCount: questions.length,
      },
      questions: questions.map((q: any) => ({
        _id: q._id.toString(),
        type: q.type,
        questionText: q.questionText,
        options: q.options ?? [],
        marks: q.marks ?? 1,
        imageUrl: q.imageUrl ?? null,
      })),
    })
  } catch (error: any) {
    console.error('Exam fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}