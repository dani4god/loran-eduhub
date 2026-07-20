//payments/verify/route.ts
import Course from '@/models/Course'
import Tutor from '@/models/Tutor'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Payment from '@/models/Payment'
import { addDays } from 'date-fns'
import { PLAN_DURATIONS, PlanType } from '@/lib/constants'
import { buildCourseDetails, createPaymentRecord, computeSelectionsAmount } from '@/lib/pricing'

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

  // ── Recompute pricing from each tutor's own rates — never trust a
  // client-supplied amount. This determines each Enrollment's locked-in
  // price at the moment of creation. ──
  const { total: expectedTotal, amounts } = await computeSelectionsAmount(
    selections,
    plan as PlanType
  )

  // Defense-in-depth: what Paystack actually confirmed should match what we
  // independently compute from current tutor pricing. Small variance allowed
  // for rounding only — anything larger means tampering or a pricing change
  // mid-flow, and we refuse to silently proceed.
  if (Math.abs(expectedTotal - amountPaid) > 1) {
    throw new Error(
      `Payment amount mismatch: expected ₦${expectedTotal}, received ₦${amountPaid}`
    )
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

  // ── Create Enrollments — each locked in at its own tutor's price ──
  const groupId = new mongoose.Types.ObjectId()
  const startDate = new Date()
  const endDate = addDays(startDate, PLAN_DURATIONS[plan as PlanType])
  const enrollmentIds: mongoose.Types.ObjectId[] = []

  for (const priced of amounts) {
    const enrollment = await Enrollment.create({
      studentId: student._id,
      tutorId: priced.tutorId,
      courseId: priced.courseId,
      plan,
      status: 'active', // immediately active since payment confirmed
      groupId,
      startDate,
      amount: priced.amount,
      endDate,
    } as any)

    enrollmentIds.push(enrollment._id)
  }

  // ── Link enrollments to student ──
  await Student.findByIdAndUpdate(student._id, {
    $push: { enrollments: { $each: enrollmentIds } },
  })

  // ── Create Payment record ──
  // Build course details for the payment
  const courseDetails = await Promise.all(
    amounts.map(async (priced) => {
      const [course, tutor] = await Promise.all([
        Course.findById(priced.courseId).select('title name'),
        Tutor.findById(priced.tutorId).select('firstName lastName'),
      ])

      return {
        courseId: priced.courseId,
        courseName: course?.name ?? 'Unknown Course',

        tutorId: priced.tutorId,
        tutorName: tutor
          ? `${tutor.firstName ?? ''} ${tutor.lastName ?? ''}`.trim()
          : 'Unknown Tutor',

        planPrice: priced.amount,

        planKey: plan as 'monthly' | '3months' | '6months' | '1year',
      }
    })
  )

  const durationMap = {
    trial: 7,
    monthly: 30,
    '3months': 90,
    '6months': 180,
    '1year': 365,
  }

  const amount = courseDetails.reduce(
    (sum, item) => sum + item.planPrice,
    0
  )

  const tutorCount = new Set(
    courseDetails.map(item => item.tutorId.toString())
  ).size

  await Payment.create({
    studentId: student._id,
    enrollmentIds,
    groupId,

    courseDetails,

    amount,

    currency: 'NGN',

    plan,

    planDurationDays: durationMap[plan as keyof typeof durationMap],

    tutorCount,

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
      amount: 0,
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

    // We only handle charge.success here.
    // Note: for NEW REGISTRATIONS, the webhook alone can't create accounts
    // because it doesn't have the password — that happens via the GET route
    // (client-side). The webhook is a backup to mark payments as confirmed.
    // For RENEWALS, the webhook is the one place that actually extends the
    // enrollment if the client-side verify-renewal call never fires
    // (e.g. user closes the tab right after paying).
    if (event.event === 'charge.success') {
      await connectDB()
      const reference = event.data.reference
      const metadata = event.data.metadata || {}

      const existingPayment = await Payment.findOne({ paystackReference: reference })

      if (existingPayment && existingPayment.status !== 'success') {
        if (metadata.type === 'renewal' && metadata.enrollmentId && metadata.newPlan) {
          const enrollment = await Enrollment.findById(metadata.enrollmentId)
          if (enrollment) {
            const durationDays = PLAN_DURATIONS[metadata.newPlan as PlanType]
            const now = new Date()
            const stillActive =
              enrollment.status === 'active' && enrollment.endDate && enrollment.endDate > now
            const baseDate = stillActive ? enrollment.endDate : now

            enrollment.plan = metadata.newPlan
            enrollment.status = 'active'
            enrollment.endDate = addDays(baseDate, durationDays)
            enrollment.paymentId = existingPayment._id
            if (enrollment.pausedAt) enrollment.pausedAt = undefined
            if (enrollment.pausedBy) enrollment.pausedBy = undefined
            await enrollment.save()
          }
        }

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