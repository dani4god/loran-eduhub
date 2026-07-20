// app/api/subscriptions/renew/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Student from '@/models/Student'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import { PLAN_PRICING_KEY, PlanType } from '@/lib/constants'
import { authOptions } from '@/lib/auth'

const durationMap = {
  trial: 7,
  monthly: 30,
  '3months': 90,
  '6months': 180,
  '1year': 365,
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enrollmentId, newPlan } = await req.json()

    if (newPlan === 'trial') {
      return NextResponse.json({ error: 'Cannot renew into a trial plan' }, { status: 400 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const enrollment = await Enrollment.findById(enrollmentId).populate('studentId')
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (enrollment.studentId._id.toString() !== student._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [tutor, course] = await Promise.all([
      Tutor.findById(enrollment.tutorId).select('firstName lastName pricing'),
      Course.findById(enrollment.courseId).select('name'),
    ])

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const priceKey = PLAN_PRICING_KEY[newPlan as Exclude<PlanType, 'trial'>]
    const totalAmount = tutor.pricing?.[priceKey]

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'This tutor has not set a price for the selected plan' },
        { status: 400 }
      )
    }

    // Build the courseDetails[] the Payment schema now requires — same
    // shape used in payments/verify/route.ts.
    const courseDetails = [
      {
        courseId: enrollment.courseId,
        courseName: course?.name ?? 'Unknown Course',
        tutorId: enrollment.tutorId,
        tutorName: `${tutor.firstName ?? ''} ${tutor.lastName ?? ''}`.trim() || 'Unknown Tutor',
        planPrice: totalAmount,
        planKey: newPlan as 'monthly' | '3months' | '6months' | '1year',
      },
    ]

    // paystackReference is intentionally left unset here (schema is
    // unique+sparse, so omitting it entirely is safe for multiple pending
    // payments) — it's filled in right after Paystack responds below.
    const payment = (await Payment.create({
      studentId: enrollment.studentId._id,
      enrollmentIds: [enrollmentId],
      courseDetails,
      amount: totalAmount,
      currency: 'NGN',
      plan: newPlan,
      planDurationDays: durationMap[newPlan as keyof typeof durationMap],
      tutorCount: 1,
      status: 'pending',
    })) as any

    const studentWithUser = await Student.findById(enrollment.studentId).populate('userId')
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: (studentWithUser?.userId as any).email,
        amount: totalAmount * 100,
        reference: `RENEW-${enrollment._id}-${Date.now()}`,
        callback_url: `${process.env.NEXTAUTH_URL}/payment/renew-verify`,
        metadata: {
          enrollmentId: enrollment._id.toString(),
          paymentId: payment._id.toString(),
          newPlan,
          type: 'renewal',
        },
      }),
    })

    const data = await paystackResponse.json()

    if (!data.status) {
      // Clean up the pending Payment record since initialization failed —
      // otherwise it lingers forever with no real Paystack reference.
      await Payment.findByIdAndDelete(payment._id)
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 400 })
    }

    await Payment.findByIdAndUpdate(payment._id, { paystackReference: data.data.reference })

    return NextResponse.json({ success: true, authorizationUrl: data.data.authorization_url })
  } catch (error) {
    console.error('Renewal error:', error)
    return NextResponse.json({ error: 'Failed to process renewal' }, { status: 500 })
  }
}