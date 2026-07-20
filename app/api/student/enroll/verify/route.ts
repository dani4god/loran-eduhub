// app/api/student/enroll/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Payment from '@/models/Payment'
import { computeSelectionsAmount, buildCourseDetails, createPaymentRecord } from '@/lib/pricing'
import { PlanType } from '@/lib/constants'

async function verifyWithPaystack(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')
    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Idempotency — Paystack may redirect back more than once.
    const existingPayment = await Payment.findOne({ paystackReference: reference })
    if (existingPayment) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        enrollmentIds: existingPayment.enrollmentIds.map((id: any) => id.toString()),
      })
    }

    const verification = await verifyWithPaystack(reference)
    if (!verification.data || verification.data.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not confirmed (status: ${verification.data?.status ?? 'unknown'})` },
        { status: 400 }
      )
    }

    const metadata = verification.data.metadata || {}
    const { plan, selections, studentId } = metadata

    if (studentId !== student._id.toString()) {
      return NextResponse.json({ error: 'This payment does not belong to your account' }, { status: 403 })
    }

    const amountPaid = verification.data.amount / 100

    const { total: expectedTotal, amounts } = await computeSelectionsAmount(selections, plan as PlanType)

    if (Math.abs(expectedTotal - amountPaid) > 1) {
      return NextResponse.json(
        { error: `Payment amount mismatch: expected ₦${expectedTotal}, received ₦${amountPaid}` },
        { status: 400 }
      )
    }

    const groupId = new mongoose.Types.ObjectId()
    const startDate = new Date()
    const enrollmentIds: string[] = []

    for (const priced of amounts) {
      // Skip if somehow already enrolled by the time payment cleared.
      const dup = await Enrollment.findOne({
        studentId: student._id,
        courseId: priced.courseId,
        tutorId: priced.tutorId,
        status: { $in: ['active', 'paused'] },
      })
      if (dup) continue

      const enrollment = await Enrollment.create({
        studentId: student._id,
        tutorId: priced.tutorId,
        courseId: priced.courseId,
        plan,
        status: 'active',
        groupId,
        startDate,
        amount: priced.amount,
      } as any)

      enrollmentIds.push(enrollment._id.toString())
    }

    await Student.findByIdAndUpdate(student._id, {
      $push: { enrollments: { $each: enrollmentIds } },
    })

    const courseDetails = await buildCourseDetails(amounts, plan as PlanType)

    await createPaymentRecord({
      studentId: student._id.toString(),
      enrollmentIds,
      groupId: groupId.toString(),
      plan: plan as PlanType,
      courseDetails,
      amount: amountPaid,
      paystackReference: reference,
      status: 'success',
    })

    return NextResponse.json({ success: true, alreadyProcessed: false, enrollmentIds })
  } catch (error: any) {
    console.error('Enroll verify error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}