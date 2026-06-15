// app/api/subscriptions/renew/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Student from '@/models/Student'
import Payment from '@/models/Payment'
import { PLAN_PRICES, PLAN_DURATIONS } from '@/lib/constants'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enrollmentId, newPlan } = await req.json()

    await connectDB()

    const enrollment = await Enrollment.findById(enrollmentId).populate('studentId')
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const basePrice = PLAN_PRICES[newPlan as keyof typeof PLAN_PRICES]
    const totalAmount = basePrice // For single course renewal

    // Create payment for renewal
    const payment = await Payment.create({
      studentId: enrollment.studentId._id,
      enrollmentIds: [enrollmentId],
      amount: totalAmount,
      currency: 'NGN',
      status: 'pending',
      plan: newPlan,
    }) as any

    // Initialize Paystack payment
    const student = await Student.findById(enrollment.studentId).populate('userId')
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: (student?.userId as any).email,
        amount: totalAmount * 100,
        reference: `RENEW-${enrollment._id}-${Date.now()}`,
        callback_url: `${process.env.NEXTAUTH_URL}/payment/verify`,
        metadata: {
          enrollmentId: enrollment._id.toString(),
          paymentId: payment._id.toString(),
          type: 'renewal',
        },
      }),
    })

    const data = await paystackResponse.json()

    if (!data.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 400 })
    }

    await Payment.findByIdAndUpdate(payment._id, { paystackReference: data.data.reference })

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
    })

  } catch (error) {
    console.error('Renewal error:', error)
    return NextResponse.json({ error: 'Failed to process renewal' }, { status: 500 })
  }
}