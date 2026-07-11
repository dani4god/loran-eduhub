import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Payment from '@/models/Payment'
import { addDays } from 'date-fns'


type Plan = 'trial' | '3months' | '6months' | '1year'

const PLAN_DURATIONS: Record<Plan, number> = {
  trial: 7,
  '3months': 90,
  '6months': 180,
  '1year': 365,
}

const PLAN_BASE_PRICES: Record<Plan, number> = {
  trial: 0,
  '3months': 45000,
  '6months': 80000,
  '1year': 150000,
}


async function verifyWithPaystack(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  )
  return res.json()
}

async function createAccountAfterPayment(
  registrationData: any,
  reference: string,
  amountPaid: number
) {
  await connectDB()

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    state,
    dateOfBirth,
    plan,
    selections, // [{ courseId, tutorId }]
  } = registrationData

  const enrollmentAmount = PLAN_BASE_PRICES[plan as Plan]

  // ── Check if account already exists (idempotency — webhook may fire twice) ──
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
  if (existingUser) {
    // Account already created — find the payment and return groupId
    const existingPayment = await Payment.findOne({ paystackReference: reference })
    const existingStudent = await Student.findOne({ userId: existingUser._id })
    return {
      alreadyExists: true,
      groupId: existingPayment?.groupId?.toString() ?? '',
      studentId: existingStudent?._id?.toString() ?? '',
    }
  }

  // ── Create User ──
  const user = await User.create({
    email: email.toLowerCase().trim(),
    password, // pre-save hook in User model will hash this
    role: 'student',
  })

  // ── Create Student ──
  const student = await Student.create({
    userId: user._id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    state,
    dateOfBirth: dateOfBirth || undefined,
    hasUsedFreeTrial: false,
  })

  // ── Create Enrollments ──
  const groupId = new mongoose.Types.ObjectId()
  const startDate = new Date()
  const endDate = addDays(startDate, PLAN_DURATIONS[plan as Plan])
  const enrollmentIds: mongoose.Types.ObjectId[] = []

  for (const sel of selections) {
    const { courseId, tutorId } = sel
    if (!courseId || !tutorId) continue

    const enrollment = await Enrollment.create({
      studentId: student._id,
      tutorId,
      courseId,
      plan,
      status: 'active', // immediately active since payment confirmed
      groupId,
      startDate,
      amount: enrollmentAmount,
      endDate,
    } as any)

    enrollmentIds.push(enrollment._id)
  }

  // ── Link enrollments to student ──
  await Student.findByIdAndUpdate(student._id, {
    $push: { enrollments: { $each: enrollmentIds } },
  })

  // ── Create Payment record ──
  const courseCount = selections.length
  const basePlanAmount = PLAN_BASE_PRICES[plan as Plan]

  await Payment.create({
    studentId: student._id,
    enrollmentIds,
    groupId,
    amount: amountPaid,
    currency: 'NGN',
    plan,
    tutorCount: courseCount,
    basePlanAmount,
    paystackReference: reference,
    status: 'success',
    paidAt: new Date(),
  })

  return {
    alreadyExists: false,
    groupId: groupId.toString(),
    studentId: student._id.toString(),
    userId: user._id.toString(),
  }
}

async function createTrialAccount(registrationData: any) {
  await connectDB()

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    state,
    dateOfBirth,
    plan,
    selections,
  } = registrationData

  // Idempotency check
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
  if (existingUser) {
    const existingStudent = await Student.findOne({ userId: existingUser._id })
    return {
      alreadyExists: true,
      studentId: existingStudent?._id?.toString() ?? '',
      groupId: '',
    }
  }

  const user = await User.create({
    email: email.toLowerCase().trim(),
    password,
    role: 'student',
  })

  const student = await Student.create({
    userId: user._id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    state,
    dateOfBirth: dateOfBirth || undefined,
    hasUsedFreeTrial: true,
  })

  const groupId = new mongoose.Types.ObjectId()
  const startDate = new Date()
  const endDate = addDays(startDate, PLAN_DURATIONS['trial'])
  const enrollmentIds: mongoose.Types.ObjectId[] = []

  for (const sel of selections) {
    const { courseId, tutorId } = sel
    if (!courseId || !tutorId) continue

    const enrollment = await Enrollment.create({
      studentId: student._id,
      tutorId,
      courseId,
      plan: 'trial',
      status: 'active',
      // cast to any to allow additional field not present in TS type defs
      groupId,
      startDate,
      endDate,
    } as any)

    enrollmentIds.push(enrollment._id)
  }

  await Student.findByIdAndUpdate(student._id, {
    $push: { enrollments: { $each: enrollmentIds } },
  })

  return {
    alreadyExists: false,
    studentId: student._id.toString(),
    groupId: groupId.toString(),
  }
}

// ── GET: client-side verification after Paystack popup closes ──
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')
    const registrationDataRaw = searchParams.get('data')

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    if (!registrationDataRaw) {
      return NextResponse.json(
        { error: 'Registration data missing' },
        { status: 400 }
      )
    }

    let registrationData: any
    try {
      registrationData = JSON.parse(decodeURIComponent(registrationDataRaw))
    } catch {
      return NextResponse.json(
        { error: 'Invalid registration data' },
        { status: 400 }
      )
    }

    // ── Verify payment with Paystack ──
    const verification = await verifyWithPaystack(reference)

    if (!verification.data || verification.data.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not confirmed (status: ${verification.data?.status ?? 'unknown'})` },
        { status: 400 }
      )
    }

    const amountPaid = verification.data.amount / 100 // convert kobo back to NGN

    // ── Create account ──
    const result = await createAccountAfterPayment(
      registrationData,
      reference,
      amountPaid
    )

    return NextResponse.json({
      success: true,
      groupId: result.groupId,
      studentId: result.studentId,
      alreadyProcessed: result.alreadyExists,
    })
  } catch (error: any) {
    console.error('Payment verify GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}

// ── POST: Paystack webhook ──
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    const expectedSig = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex')

    if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // We only handle charge.success here
    // Note: webhook alone can't create accounts because it doesn't have
    // the password — account creation happens via the GET route (client-side).
    // The webhook is used as a backup to mark payments as confirmed.
    if (event.event === 'charge.success') {
      await connectDB()
      const reference = event.data.reference

      // If account was already created (via GET route), just update payment status
      const existingPayment = await Payment.findOne({ paystackReference: reference })
      if (existingPayment && existingPayment.status !== 'success') {
        await Payment.findByIdAndUpdate(existingPayment._id, {
          status: 'success',
          paidAt: new Date(),
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}