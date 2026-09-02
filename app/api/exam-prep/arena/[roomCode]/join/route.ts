//app/api/exam-prep/arena/[roomCode]/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'
import { requireExamPrepAccess } from '@/lib/examPrepAuth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const access = await requireExamPrepAccess(req)
  if (!access.ok) return access.response

  const { roomCode } = await params
  await connectDB()

  const room = await ExamCompetitionRoom.findOne({ roomCode: roomCode.toUpperCase() })
  if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
  if (room.startedAt || ['completed', 'cancelled'].includes(room.status)) {
    return NextResponse.json({ error: 'Room is closed to new participants.' }, { status: 403 })
  }

  const count = await ExamCompetitionParticipant.countDocuments({ roomId: room._id })
  if (count >= room.maxParticipants) return NextResponse.json({ error: 'Room is full.' }, { status: 409 })

  await ExamCompetitionParticipant.findOneAndUpdate(
    { roomId: room._id, examPrepStudentId: access.student._id },
    { $setOnInsert: { joinedAt: new Date() } },
    { upsert: true, new: true }
  )

  return NextResponse.json({ success: true })
}
