// app/api/exam-prep/live-exams/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LiveExam from '@/models/LiveExam'
import LiveExamAttempt from '@/models/LiveExamAttempt'
import ExamPrepStudent from '@/models/ExamPrepStudent'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { regNumber, answers } = await req.json()
  await connectDB()

  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const existing = await LiveExamAttempt.findOne({ liveExamId: id, examPrepStudentId: student._id })
  if (existing) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

  const exam = await LiveExam.findById(id)
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let score = 0, total = 0
  for (const q of exam.questions as any[]) {
    const marks = q.marks || 1
    total += marks
    const selected = (answers?.[q._id.toString()] || '').toString().trim().toLowerCase()
    if (selected && selected === q.correctAnswer.trim().toLowerCase()) score += marks
  }
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  await LiveExamAttempt.create({ liveExamId: id, examPrepStudentId: student._id, score, total, percentage })

  return NextResponse.json({ success: true, score, total, percentage })
}