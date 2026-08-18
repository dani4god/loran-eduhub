// app/api/self-paced/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

  await connectDB()
  const slots = await TutorAvailabilitySlot.find({
    courseId,
    isBooked: false,
    date: { $gte: new Date() },
  }).select('date startTime endTime').sort({ date: 1, startTime: 1 })

  return NextResponse.json({ slots })
}