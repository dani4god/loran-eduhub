// app/api/tutor/feedback/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import WithdrawalFeedback from '@/models/WithdrawalFeedback'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const feedback = await WithdrawalFeedback.find({ tutorId: tutor._id })
    .sort({ createdAt: -1 })

  const mapped = feedback.map((f: any) => ({
    _id: f._id.toString(),
    studentId: f.studentId.toString(),
    student: f.studentSnapshot,
    course: f.courseSnapshot,
    reason: f.reason,
    feedback: f.feedback,
    withdrawnAt: f.withdrawnAt,
  }))

  return NextResponse.json({ feedback: mapped })
}