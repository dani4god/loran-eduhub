// app/api/dashboard/student/exams/[examId]/submit/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Exam from '@/models/Exam'
import Question from '@/models/Question'
import Grade from '@/models/Grade'
import Enrollment from '@/models/Enrollment'

export async function POST(
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

    const exam = await Exam.findById(examId).lean() as any
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Verify enrollment FIRST — everything below is scoped to this specific
    // enrollment, so a grade from a withdrawn enrollment never blocks or
    // gets confused with a grade from a fresh re-enrollment.
    const enrollment = await Enrollment.findOne({
      studentId: student._id,
      courseId: exam.courseId,
      status: 'active' as const,
    })
    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Idempotency — scoped to THIS enrollment, not just studentId+examId.
    const existingGrade = await Grade.findOne({
      studentId: student._id,
      examId,
      enrollmentId: enrollment._id,
    })
    if (existingGrade) {
      return NextResponse.json(
        {
          error: 'Exam already submitted',
          alreadySubmitted: true,
          grade: {
            score: existingGrade.score,
            total: existingGrade.total,
            percentage:
              existingGrade.total > 0
                ? Math.round(
                    (existingGrade.score / existingGrade.total) * 100
                  )
                : 0,
          },
        },
        { status: 400 }
      )
    }

    // answers: { [questionId]: string }
    const { answers, timeTaken } = await req.json()

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    // Fetch all questions WITH correct answers for grading
    const questions = await Question.find({ examId }).lean()

    let score = 0
    let total = 0
    const breakdown: any[] = []

    for (const q of questions as any[]) {
      const qId = q._id.toString()
      const studentAnswer = answers[qId]?.toString().trim().toLowerCase() ?? ''
      const correctAnswer = q.correctAnswer?.toString().trim().toLowerCase() ?? ''
      const marks = q.marks ?? 1
      total += marks

      const isCorrect =
        studentAnswer !== '' && studentAnswer === correctAnswer

      if (isCorrect) score += marks

      breakdown.push({
        questionId: qId,
        questionText: q.questionText,
        type: q.type,
        studentAnswer: answers[qId] ?? null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marks,
        awarded: isCorrect ? marks : 0,
      })
    }

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0

    // Save grade
    const grade = await Grade.create({
      studentId: student._id,
      enrollmentId: enrollment._id,
      examId,
      courseId: exam.courseId,
      tutorId: exam.tutorId,
      score,
      total,
      percentage,
      timeTaken: timeTaken ?? null,
      feedback: '',
      gradedAt: new Date(),
      breakdown,
    });

    return NextResponse.json({
      success: true,
      result: {
        gradeId: grade._id.toString(),
        score,
        total,
        percentage,
        passed: percentage >= 50,
        timeTaken,
        breakdown,
      },
    })
  } catch (error: any) {
    console.error('Exam submit error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}