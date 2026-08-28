// app/api/exam-prep/exam/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import ExamPrepSession from '@/models/ExamPrepSession'
import { fetchExamQuestions } from '@/lib/alocApi'

const ALLOWED_DURATIONS = [15, 30, 45, 60]

export async function POST(req: NextRequest) {
  const { regNumber, examType, subject, year, durationMinutes } = await req.json()
  await connectDB()

  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const settings = await ExamPrepSettings.findOne({ key: 'global' })
  if (settings?.isLocked) return NextResponse.json({ error: 'Practice exams are currently unavailable.' }, { status: 403 })

  const sub = await ExamPrepSubscription.findOne({ examPrepStudentId: student._id })
  const hasAccess = sub?.wasFreeAtRegistration || (sub?.endDate ? sub.endDate > new Date() : sub?.planDuration === 'life')
  if (!hasAccess) return NextResponse.json({ error: 'Subscription required', requiresPayment: true }, { status: 403 })

  const duration = ALLOWED_DURATIONS.includes(durationMinutes) ? durationMinutes : 30

  try {
    const questions = await fetchExamQuestions({
      examType, subject, year: year ? Number(year) : undefined, count: 30,
    })
    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions available for this selection right now.' }, { status: 502 })
    }

    const sessionToken = crypto.randomBytes(24).toString('hex')

    await ExamPrepSession.create({
      sessionToken,
      examPrepStudentId: student._id,
      examType, subject,
      questions: questions.map((q) => ({ id: q.id, text: q.text, options: q.options, correctAnswer: q.correctAnswer })),
      durationMinutes: duration,
      expiresAt: new Date(Date.now() + (duration + 15) * 60 * 1000),
    })

    return NextResponse.json({
      sessionToken,
      durationMinutes: duration,
      questions: questions.map((q) => ({ id: q.id, text: q.text, options: q.options, section: q.section, imageUrl: q.imageUrl })),
    })
  } catch {
    return NextResponse.json({ error: 'Could not fetch questions right now. Please try again shortly.' }, { status: 502 })
  }
}