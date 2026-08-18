// app/api/tutor/availability/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const slot = await TutorAvailabilitySlot.findById(id)
  if (!slot || slot.tutorId.toString() !== tutor._id.toString()) {
    return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
  }
  if (slot.isBooked) {
    return NextResponse.json({ error: 'Cannot remove a slot that has already been booked' }, { status: 400 })
  }

  await TutorAvailabilitySlot.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}