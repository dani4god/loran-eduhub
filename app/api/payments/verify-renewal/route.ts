// app/api/payments/verify-renewal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Payment from '@/models/Payment'
import { PLAN_DURATIONS, PlanType } from '@/lib/constants'
import { addDays } from 'date-fns'

async function verifyWithPaystack(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    await connectDB()

    const verification = await verifyWithPaystack(reference)

    if (!verification.data || verification.data.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not confirmed (status: ${verification.data?.status ?? 'unknown'})` },
        { status: 400 }
      )
    }

    const metadata = verification.data.metadata || {}
    const { enrollmentId, newPlan } = metadata

    if (!enrollmentId || !newPlan) {
      return NextResponse.json({ error: 'Missing renewal metadata' }, { status: 400 })
    }

    const payment = await Payment.findOne({ paystackReference: reference })
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    // Idempotency — if this payment was already applied (webhook + client-side
    // both fire), don't extend the enrollment twice.
    if (payment.status === 'success') {
      const enrollment = await Enrollment.findById(enrollmentId)
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        enrollmentId,
        newEndDate: enrollment?.endDate,
      })
    }

    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const durationDays = PLAN_DURATIONS[newPlan as PlanType]
    const now = new Date()

    // Stack on top of remaining time if still active; otherwise start fresh from today.
    const stillActive = enrollment.status === 'active' && enrollment.endDate && enrollment.endDate > now
    const baseDate = stillActive ? enrollment.endDate : now
    const newEndDate = addDays(baseDate, durationDays)

    enrollment.plan = newPlan
    enrollment.status = 'active'
    enrollment.endDate = newEndDate
    enrollment.paymentId = payment._id
    if (enrollment.pausedAt) enrollment.pausedAt = undefined
    if (enrollment.pausedBy) enrollment.pausedBy = undefined
    await enrollment.save()

    await Payment.findByIdAndUpdate(payment._id, {
      status: 'success',
      paidAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      alreadyProcessed: false,
      enrollmentId,
      newEndDate,
    })
  } catch (error: any) {
    console.error('Renewal verify error:', error)
    return NextResponse.json(
      { error: error.message || 'Renewal verification failed' },
      { status: 500 }
    )
  }
}