// app/api/self-paced/purchase/quick/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import { syncSelfPacedStudentDiscordRoles } from '@/lib/discordSync'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const course = await SelfPacedCourse.findById(courseId)
  if (!course || course.status !== 'published') {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const existing = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId })
  if (existing) {
    return NextResponse.json({ error: 'You already own this course' }, { status: 400 })
  }

  if (course.price === 0) {
    await SelfPacedEnrollment.create({
      selfPacedStudentId: student._id,
      courseId,
      tutorId: course.tutorId,
      amountPaid: 0,
      weekProgress: [],
    })
    if (student.discordId) {
      await syncSelfPacedStudentDiscordRoles(student._id.toString(), student.discordId).catch(() => {})
    }
    return NextResponse.json({ success: true, isFree: true, requiresPayment: false })
  }

  if (!PAYSTACK_SECRET) {
    return NextResponse.json({ error: 'Paystack not configured on server' }, { status: 500 })
  }

  const user = await User.findById(session.user.id).select('email')
  const reference = `SP-ADD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user?.email,
      amount: Math.round(course.price * 100),
      reference,
      currency: 'NGN',
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard/self-paced/purchase`,
      metadata: { type: 'self_paced_addon', courseId, selfPacedStudentId: student._id.toString() },
    }),
  })

  const paystackData = await paystackRes.json()
  if (!paystackData.status) {
    return NextResponse.json({ error: paystackData.message || 'Paystack initialization failed' }, { status: 400 })
  }

  return NextResponse.json({
    success: true, requiresPayment: true,
    accessCode: paystackData.data.access_code,
    reference: paystackData.data.reference,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    amount: course.price, email: user?.email,
  })
}