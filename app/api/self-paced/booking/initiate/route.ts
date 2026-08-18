// app/api/self-paced/booking/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'
import CoachingBooking from '@/models/CoachingBooking'
import User from '@/models/User'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, slotId } = await req.json()
  if (!courseId || !slotId) {
    return NextResponse.json({ error: 'courseId and slotId are required' }, { status: 400 })
  }

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const enrollment = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId })
  if (!enrollment) {
    return NextResponse.json({ error: 'You must own this course to book coaching' }, { status: 403 })
  }

  const course = await SelfPacedCourse.findById(courseId)
  if (!course?.coachingEnabled) {
    return NextResponse.json({ error: 'Coaching is not available for this course' }, { status: 400 })
  }

  const slot = await TutorAvailabilitySlot.findById(slotId)
  if (!slot || slot.isBooked || slot.courseId.toString() !== courseId) {
    return NextResponse.json({ error: 'This slot is no longer available' }, { status: 400 })
  }

  const user = await User.findById(session.user.id).select('email')
  const rate = course.coachingHourlyRate

  if (!PAYSTACK_SECRET) {
    return NextResponse.json({ error: 'Paystack not configured on server' }, { status: 500 })
  }

  const reference = `COACH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user?.email,
      amount: Math.round(rate * 100),
      reference,
      currency: 'NGN',
      callback_url: `${process.env.NEXTAUTH_URL}/self-paced/booking/verify`,
      metadata: { type: 'coaching_booking', courseId, slotId, studentId: student._id.toString(), tutorId: course.tutorId.toString() },
    }),
  })

  const paystackData = await paystackRes.json()
  if (!paystackData.status) {
    return NextResponse.json({ error: paystackData.message || 'Paystack initialization failed' }, { status: 400 })
  }

  // Create as pending immediately, and soft-hold the slot by flagging it —
  // fully committed once payment verifies.
  await CoachingBooking.create({
    selfPacedStudentId: student._id,
    tutorId: course.tutorId,
    courseId,
    slotId,
    amountPaid: rate,
    paystackReference: reference,
    status: 'pending_payment',
  })

  return NextResponse.json({
    success: true,
    accessCode: paystackData.data.access_code,
    reference: paystackData.data.reference,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    amount: rate,
    email: user?.email,
  })
}