// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Student from '@/models/Student'
import User from '@/models/User'
import Enrollment from '@/models/Enrollment'
import mongoose from 'mongoose'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  try {
    const { studentId, plan, enrollmentIds, amount, groupId } = await req.json()

    if (!studentId || !plan || !enrollmentIds?.length || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, plan, enrollmentIds, amount' },
        { status: 400 }
      )
    }

    if (!PAYSTACK_SECRET) {
      return NextResponse.json(
        { error: 'Paystack not configured on server' },
        { status: 500 }
      )
    }

    await connectDB()

    // ── Get student ──
    const student = await Student.findById(studentId)
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // ── Get user (for email) ──
    const user = await User.findById(student.userId)
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 })
    }

    // ── Resolve groupId ──
    const resolvedGroupId = groupId
      ? new mongoose.Types.ObjectId(groupId)
      : new mongoose.Types.ObjectId()

    // ── Generate reference BEFORE creating payment ──
    const reference = `LORAN-${resolvedGroupId.toString()}-${Date.now()}`

    // ── Count distinct tutors from enrollments ──
    const enrollments = await Enrollment.find({
      _id: { $in: enrollmentIds },
    }).select('tutorId plan')

    const courseCount = enrollmentIds.length
    const basePlanAmount = Math.round(amount / courseCount)

    // ── Create payment record with reference already set ──
    const payment = await Payment.create({
      studentId,
      enrollmentIds,
      groupId: resolvedGroupId,
      amount,
      currency: 'NGN',
      plan,
      tutorCount: courseCount,
      basePlanAmount,
      paystackReference: reference,
      status: 'pending',
    })

    // ── Initialize Paystack transaction ──
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100), // convert NGN to kobo
        reference,
        callback_url: `${process.env.NEXTAUTH_URL}/payment/verify`,
        currency: 'NGN',
        metadata: {
          studentId: student._id.toString(),
          paymentId: payment._id.toString(),
          groupId: resolvedGroupId.toString(),
          plan,
          courseCount,
        },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      // Roll back payment record since Paystack rejected it
      await Payment.findByIdAndDelete(payment._id)
      return NextResponse.json(
        { error: paystackData.message || 'Paystack initialization failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentId: payment._id.toString(),
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      amount,
      email: user.email,
    })
  } catch (error: any) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}