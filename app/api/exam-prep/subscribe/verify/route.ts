//app/api/exam-prep/subscribe/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

function endDateFor(plan: string, start: Date) {
  if (plan === 'life') return undefined
  const days = plan === '1month' ? 30 : plan === '2months' ? 60 : plan === '3months' ? 90 : 0
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireExamPrepStudent(req)
    if (!auth.ok) return auth.response

    const { reference } = await req.json()
    if (!reference) return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 500 })

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })

    const data = await response.json()
    if (!response.ok || !data?.status || data?.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment has not been confirmed.' }, { status: 400 })
    }

    const metadata = data.data.metadata || {}
    if (metadata.purpose !== 'exam_prep_subscription' || metadata.examPrepStudentId !== auth.student._id.toString()) {
      return NextResponse.json({ error: 'Payment metadata does not match this account.' }, { status: 403 })
    }

    await connectDB()
    const settings = await ExamPrepSettings.findOne({ key: 'global' }).lean()
    const plan = (settings?.plans || []).find((p: any) => p.duration === metadata.planDuration && p.enabled)
    if (!plan) return NextResponse.json({ error: 'Subscription plan is no longer available.' }, { status: 400 })

    const paidNaira = Number(data.data.amount || 0) / 100
    if (paidNaira < Number(plan.price)) {
      return NextResponse.json({ error: 'Paid amount is lower than the plan price.' }, { status: 400 })
    }

    const existing = await ExamPrepSubscription.findOne({ examPrepStudentId: auth.student._id })
    if (existing?.paystackReference === reference) {
      return NextResponse.json({ success: true, subscription: existing })
    }

    const start = new Date()
    const subscription = await ExamPrepSubscription.findOneAndUpdate(
      { examPrepStudentId: auth.student._id },
      {
        wasFreeAtRegistration: false,
        planDuration: metadata.planDuration,
        amountPaid: paidNaira,
        paystackReference: reference,
        startDate: start,
        endDate: endDateFor(metadata.planDuration, start),
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Exam Prep verify:', error)
    return NextResponse.json({ error: 'Could not verify payment.' }, { status: 500 })
  }
}
