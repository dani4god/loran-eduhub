// app/api/tutor/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  const query: any = { tutorId: tutor._id, date: { $gte: new Date() } }
  if (courseId) query.courseId = courseId

  const slots = await TutorAvailabilitySlot.find(query).sort({ date: 1, startTime: 1 })
  return NextResponse.json({ slots })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, date, startTime, endTime } = await req.json()
  if (!courseId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: 'courseId, date, startTime, and endTime are required' }, { status: 400 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const slot = await TutorAvailabilitySlot.create({
    tutorId: tutor._id,
    courseId,
    date: new Date(date),
    startTime,
    endTime,
    isBooked: false,
  })

  return NextResponse.json({ success: true, slot })
}