// app/api/exam-prep/live-exams/[id]/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LiveExam from '@/models/LiveExam'
import LiveExamAttempt from '@/models/LiveExamAttempt'
import ExamPrepStudent from '@/models/ExamPrepStudent'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { regNumber } = await req.json()
  await connectDB()

  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const exam = await LiveExam.findById(id)
  if (!exam || exam.status !== 'published') return NextResponse.json({ error: 'Exam not available' }, { status: 404 })

  const now = new Date()
  const end = new Date(exam.scheduledDate.getTime() + exam.durationMinutes * 60 * 1000)
  if (now < exam.scheduledDate) return NextResponse.json({ error: 'This exam has not started yet' }, { status: 403 })
  if (now > end) return NextResponse.json({ error: 'This exam has closed' }, { status: 403 })

  const existing = await LiveExamAttempt.findOne({ liveExamId: id, examPrepStudentId: student._id })
  if (existing) return NextResponse.json({ error: 'You have already taken this exam' }, { status: 400 })

  // Remaining time is based on the exam's fixed end time, not a fresh
  // per-student clock — this is a live, shared-window exam.
  const secondsRemaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))

  return NextResponse.json({
    title: exam.title,
    secondsRemaining,
    questions: exam.questions.map((q: any) => ({ _id: q._id, type: q.type, question: q.question, options: q.options })),
  })
}