// app/api/exam-prep/live-exams/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LiveExam from '@/models/LiveExam'
import LiveExamAttempt from '@/models/LiveExamAttempt'
import ExamPrepStudent from '@/models/ExamPrepStudent'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const regNumber = searchParams.get('regNumber')
  await connectDB()

  const student = regNumber ? await ExamPrepStudent.findOne({ regNumber }) : null
  const exams = await LiveExam.find({ status: 'published' }).sort({ scheduledDate: 1 })

  const attempts = student
    ? await LiveExamAttempt.find({ examPrepStudentId: student._id, liveExamId: { $in: exams.map((e: any) => e._id) } })
    : []
  const attemptedIds = new Set(attempts.map((a: any) => a.liveExamId.toString()))

  const now = new Date()

  return NextResponse.json({
    exams: exams.map((e: any) => {
      const start = new Date(e.scheduledDate)
      const end = new Date(start.getTime() + e.durationMinutes * 60 * 1000)
      let status: 'upcoming' | 'live' | 'closed' = 'upcoming'
      if (now >= start && now <= end) status = 'live'
      else if (now > end) status = 'closed'

      return {
        _id: e._id.toString(), title: e.title, description: e.description, requirements: e.requirements,
        scheduledDate: e.scheduledDate, durationMinutes: e.durationMinutes,
        questionCount: e.questions.length, status, alreadyAttempted: attemptedIds.has(e._id.toString()),
      }
    }),
  })
}