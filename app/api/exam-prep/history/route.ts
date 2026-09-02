import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

export async function GET(req: NextRequest) {
  const auth = await requireExamPrepStudent(req)
  if (!auth.ok) return auth.response

  await connectDB()
  const attempts = await ExamPrepAttempt.find({ examPrepStudentId: auth.student._id }).sort({ createdAt: -1 }).limit(100).lean()

  return NextResponse.json({
    attempts: attempts.map((a: any) => ({
      _id: a._id.toString(),
      attemptType: a.attemptType,
      subject: a.subject,
      examType: a.examType,
      score: a.score,
      total: a.total,
      percentage: a.percentage,
      durationSeconds: a.durationSeconds,
      createdAt: a.createdAt,
    })),
  })
}
