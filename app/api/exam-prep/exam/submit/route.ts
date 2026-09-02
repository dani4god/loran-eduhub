import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepSession from '@/models/ExamPrepSession'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

interface Question {
  id: string
  fingerprint: string
  text: string
  correctAnswer: string
  subject: string
  topic?: string
  subtopic?: string
  difficulty?: string
  standard: string
  source: string
  explanation?: string
}

interface BreakdownItem {
  questionId: string
  fingerprint: string
  question: string
  selected: string
  correct: string
  isCorrect: boolean
  subject: string
  topic: string
  subtopic: string
  difficulty: string
  standard: string
  source: string
  explanation: string
}

interface ResponseBreakdownItem {
  question: string
  selected: string
  correct: string
  isCorrect: boolean
  topic: string
  explanation: string
}

interface SubmitRequest {
  sessionToken: string
  answers?: Record<string, string>
  durationSeconds?: number
}

interface SuccessResponse {
  success: boolean
  score: number
  total: number
  percentage: number
  breakdown: ResponseBreakdownItem[]
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireExamPrepStudent(req)
    if (!auth.ok) return auth.response

    const { sessionToken, answers = {}, durationSeconds = 0 } = await req.json() as SubmitRequest
    await connectDB()

    const session = await ExamPrepSession.findOne({ sessionToken, examPrepStudentId: auth.student._id })
    if (!session) return NextResponse.json({ error: 'Exam session expired or not found.' }, { status: 404 })
    if (session.used) return NextResponse.json({ error: 'Exam already submitted.' }, { status: 409 })

    let score = 0
    const breakdown: BreakdownItem[] = session.questions.map((q: Question) => {
      const selected = String(answers?.[q.id] || '').trim().toLowerCase()
      const correct = String(q.correctAnswer || '').trim().toLowerCase()
      const isCorrect = !!selected && selected === correct
      if (isCorrect) score++
      return {
        questionId: q.id,
        fingerprint: q.fingerprint,
        question: q.text,
        selected,
        correct,
        isCorrect,
        subject: q.subject,
        topic: q.topic || 'General',
        subtopic: q.subtopic || '',
        difficulty: q.difficulty || 'medium',
        standard: q.standard,
        source: q.source,
        explanation: q.explanation || '',
      }
    })

    const total = session.questions.length
    const percentage = Math.round((score / total) * 100)

    await ExamPrepAttempt.create({
      examPrepStudentId: auth.student._id,
      attemptType: 'practice',
      examType: session.examType,
      subject: session.subject,
      studentClass: session.studentClass,
      score,
      total,
      percentage,
      durationSeconds: Math.min(session.durationMinutes * 60, Math.max(0, Number(durationSeconds))),
      breakdown,
    })

    session.used = true
    await session.save()

    const response: SuccessResponse = {
      success: true,
      score,
      total,
      percentage,
      breakdown: breakdown.map((b) => ({ question: b.question, selected: b.selected, correct: b.correct, isCorrect: b.isCorrect, topic: b.topic, explanation: b.explanation })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Exam submit:', error)
    return NextResponse.json({ error: 'Could not submit exam.' }, { status: 500 })
  }
}
