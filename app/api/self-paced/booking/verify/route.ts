// app/api/self-paced/booking/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import CoachingBooking from '@/models/CoachingBooking'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'

async function verifyWithPaystack(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  return res.json()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  if (!reference) return NextResponse.json({ error: 'Reference is required' }, { status: 400 })

  await connectDB()

  const booking = await CoachingBooking.findOne({ paystackReference: reference })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  if (booking.status === 'confirmed') {
    return NextResponse.json({ success: true, alreadyProcessed: true })
  }

  const verification = await verifyWithPaystack(reference)
  if (!verification.data || verification.data.status !== 'success') {
    return NextResponse.json(
      { error: `Payment not confirmed (status: ${verification.data?.status ?? 'unknown'})` },
      { status: 400 }
    )
  }

  const slot = await TutorAvailabilitySlot.findById(booking.slotId)
  if (!slot || slot.isBooked) {
    // Someone else grabbed the slot between initiate and verify — extremely
    // rare, but must not silently confirm a double-booking.
    return NextResponse.json({ error: 'This slot was booked by someone else. Please contact support for a refund.' }, { status: 409 })
  }

  slot.isBooked = true
  await slot.save()

  booking.status = 'confirmed'
  await booking.save()

  return NextResponse.json({ success: true, alreadyProcessed: false })
}