// app/api/student/enroll/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import User from '@/models/User'
import Enrollment from '@/models/Enrollment'
import { computeSelectionsAmount } from '@/lib/pricing'
import { PlanType } from '@/lib/constants'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: 'Paystack not configured on server' }, { status: 500 })
    }

    const { plan, selections } = await req.json()

    if (!plan || plan === 'trial') {
      return NextResponse.json({ error: 'Invalid plan for additional enrollment' }, { status: 400 })
    }

    if (!selections?.length) {
      return NextResponse.json({ error: 'No courses selected' }, { status: 400 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const user = await User.findById(student.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Block re-enrolling in a course+tutor pair already active/paused.
    const existing = await Enrollment.find({
      studentId: student._id,
      status: { $in: ['active', 'paused'] },
      $or: selections.map((s: any) => ({ courseId: s.courseId, tutorId: s.tutorId })),
    })
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You are already enrolled in one or more of these courses with this tutor' },
        { status: 400 }
      )
    }

    let total: number
    try {
      const result = await computeSelectionsAmount(selections, plan as PlanType)
      total = result.total
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    const reference = `LORAN-ENROLL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(total * 100),
        reference,
        currency: 'NGN',
        callback_url: `${process.env.NEXTAUTH_URL}/dashboard/student/enroll/verify`,
        metadata: {
          type: 'new_enrollment',
          studentId: student._id.toString(),
          plan,
          selections,
        },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Paystack initialization failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      amount: total,
      email: user.email,
    })
  } catch (error: any) {
    console.error('Enroll initiate error:', error)
    return NextResponse.json({ error: error.message || 'Failed to initialize payment' }, { status: 500 })
  }
}