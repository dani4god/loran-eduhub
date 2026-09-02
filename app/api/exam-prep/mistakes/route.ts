//app/api/exam-prep/mistakes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

export async function GET(req: NextRequest) {
  const auth = await requireExamPrepStudent(req)
  if (!auth.ok) return auth.response

  await connectDB()
  const attempts = await ExamPrepAttempt.find({ examPrepStudentId: auth.student._id }).sort({ createdAt: -1 }).limit(60).lean()

  const mistakes = attempts.flatMap((attempt: any) =>
    (attempt.breakdown || [])
      .filter((b: any) => !b.isCorrect)
      .map((b: any) => ({
        attemptId: attempt._id.toString(),
        createdAt: attempt.createdAt,
        subject: b.subject || attempt.subject,
        topic: b.topic || 'General',
        question: b.question,
        selected: b.selected,
        correct: b.correct,
        explanation: b.explanation || '',
      }))
  )

  return NextResponse.json({ mistakes: mistakes.slice(0, 250) })
}
