//app/api/exam-prep/arena/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

export async function GET(req: NextRequest) {
  const auth = await requireExamPrepStudent(req)
  if (!auth.ok) return auth.response
  await connectDB()

  const rows = await ExamCompetitionParticipant.find({ examPrepStudentId: auth.student._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('roomId')
    .lean()

  return NextResponse.json({
    rooms: rows.filter((x: any) => x.roomId).map((x: any) => ({
      roomCode: x.roomId.roomCode,
      name: x.roomId.name,
      status: x.roomId.status,
      score: x.totalScore,
      total: x.totalPossible,
      percentage: x.overallPercentage,
      subjectResults: x.subjectResults,
      joinedAt: x.joinedAt,
    })),
  })
}
