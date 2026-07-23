// app/api/student/announcements/[id]/acknowledge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import AnnouncementAck from '@/models/AnnouncementAck'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  await AnnouncementAck.findOneAndUpdate(
    { announcementId: id, studentId: student._id },
    { acknowledgedAt: new Date() },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}