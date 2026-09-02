//app/api/exam-prep/arena/[roomCode]/screen-share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamCompetitionRoom from '@/models/ExamCompetitionRoom'
import ExamCompetitionParticipant from '@/models/ExamCompetitionParticipant'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const auth = await requireExamPrepStudent(req)
  if (!auth.ok) return auth.response

  const { roomCode } = await params
  const { active } = await req.json()
  await connectDB()

  const room = await ExamCompetitionRoom.findOne({ roomCode: roomCode.toUpperCase() })
  if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })

  const participant = await ExamCompetitionParticipant.findOneAndUpdate(
    { roomId: room._id, examPrepStudentId: auth.student._id },
    { $set: { screenShareActive: !!active, lastScreenShareHeartbeat: new Date() } },
    { new: true }
  )

  if (!participant) return NextResponse.json({ error: 'You have not joined this room.' }, { status: 403 })
  return NextResponse.json({ success: true })
}
