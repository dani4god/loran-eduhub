// app/api/exam-prep/subscribe/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'

const DURATION_DAYS: Record<string, number | null> = { '1month': 30, '2months': 60, '3months': 90, life: null }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

  await connectDB()
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const v = await verifyRes.json()
  if (!v.data || v.data.status !== 'success') return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })

  const { regNumber, duration, price } = v.data.metadata
  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const days = DURATION_DAYS[duration]
  const now = new Date()

  await ExamPrepSubscription.findOneAndUpdate(
    { examPrepStudentId: student._id },
    {
      wasFreeAtRegistration: false,
      planDuration: duration,
      amountPaid: price,
      paystackReference: reference,
      startDate: now,
      endDate: days ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000) : undefined,
    },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}