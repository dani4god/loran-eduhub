// app/api/exam-prep/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const regNumber = searchParams.get('regNumber')
  await connectDB()
  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const attempts = await ExamPrepAttempt.find({ examPrepStudentId: student._id }).sort({ createdAt: -1 }).limit(50)
  return NextResponse.json({
    attempts: attempts.map((a: any) => ({ _id: a._id.toString(), examType: a.examType, subject: a.subject, score: a.score, total: a.total, percentage: a.percentage, createdAt: a.createdAt })),
  })
}