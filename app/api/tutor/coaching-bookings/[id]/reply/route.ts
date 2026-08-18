// app/api/tutor/coaching-bookings/[id]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import CoachingBooking from '@/models/CoachingBooking'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, link } = await req.json()

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const booking = await CoachingBooking.findById(id)
  if (!booking || booking.tutorId.toString() !== tutor._id.toString()) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  booking.tutorReplyMessage = message || undefined
  booking.tutorReplyLink = link || undefined
  booking.repliedAt = new Date()
  await booking.save()

  return NextResponse.json({ success: true })
}