// app/api/exam-prep/exam/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepSession from '@/models/ExamPrepSession'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'

export async function POST(req: NextRequest) {
  const { sessionToken, answers, durationSeconds } = await req.json()
  await connectDB()

  const session = await ExamPrepSession.findOne({ sessionToken })
  if (!session) return NextResponse.json({ error: 'Exam session not found or expired' }, { status: 404 })
  if (session.used) return NextResponse.json({ error: 'This exam has already been submitted' }, { status: 400 })

  let score = 0
  const breakdown = session.questions.map((q: any) => {
    const selected = (answers?.[q.id] || '').toLowerCase()
    const isCorrect = selected === q.correctAnswer
    if (isCorrect) score += 1
    return { question: q.text, selected, correct: q.correctAnswer, isCorrect }
  })

  const total = session.questions.length
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  // Cast examType to the enum type
  const examType = session.examType as 'jamb' | 'waec' | 'neco'

  await ExamPrepAttempt.create({
    examPrepStudentId: session.examPrepStudentId,
    examType,
    subject: session.subject,
    score,
    total,
    percentage,
    durationSeconds,
    breakdown,
  })

  session.used = true
  await session.save()

  return NextResponse.json({ success: true, score, total, percentage, breakdown })
}