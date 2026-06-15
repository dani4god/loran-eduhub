// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Enrollment from '@/models/Enrollment'
import Student from '@/models/Student'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

export async function POST(req: NextRequest) {
  try {
    const { studentId, plan, enrollments, amount } = await req.json()

    if (!studentId || !plan || !enrollments?.length || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    const student = await Student.findById(studentId).populate('userId')
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Create payment record
    const payment = (await Payment.create({
      studentId,
      enrollmentIds: enrollments, // Group payment reference
      amount,
      currency: 'NGN',
      status: 'pending',
      plan,
    })) as any

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: (student.userId as any).email,
        amount: amount * 100, // Paystack uses kobo
        reference: `LORAN-${payment._id}-${Date.now()}`,
        callback_url: `${process.env.NEXTAUTH_URL}/payment/verify`,
        metadata: {
          studentId: student._id.toString(),
          paymentId: payment._id.toString(),
          enrollments: enrollments.map((e: string) => e.toString()),
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || 'Payment initialization failed' },
        { status: 400 }
      )
    }

    // Update payment with reference
    await Payment.findByIdAndUpdate(payment._id, {
      paystackReference: data.data.reference,
    })

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    })

  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}