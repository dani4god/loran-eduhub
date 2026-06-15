// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Enrollment from '@/models/Enrollment'
import { PLAN_DURATIONS } from '@/lib/constants'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { reference } = body

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
      },
    })

    const data = await response.json()

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    await connectDB()

    const payment = await Payment.findOne({ paystackReference: reference })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status
    payment.status = 'success'
    payment.paidAt = new Date()
    await payment.save()

    // Get all enrollments for this payment
    const metadata = data.data.metadata
    const enrollments = await Enrollment.find({
      _id: { $in: metadata.enrollments }
    })

    // Activate all enrollments
    const startDate = new Date()
    const durationDays = PLAN_DURATIONS[payment.plan as keyof typeof PLAN_DURATIONS]
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    for (const enrollment of enrollments) {
      enrollment.status = 'active'
      enrollment.startDate = startDate
      enrollment.endDate = endDate
      enrollment.paymentId = payment._id
      await enrollment.save()
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}