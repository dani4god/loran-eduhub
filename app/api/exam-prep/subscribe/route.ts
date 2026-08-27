// app/api/exam-prep/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSettings from '@/models/ExamPrepSettings'

export async function POST(req: NextRequest) {
  const { regNumber, duration, email } = await req.json()
  await connectDB()

  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const settings = await ExamPrepSettings.findOne({ key: 'global' })
  const plan = settings?.plans.find((p: any) => p.duration === duration && p.enabled)
  if (!plan) return NextResponse.json({ error: 'Invalid or unavailable plan' }, { status: 400 })

  const reference = `EXPREP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, amount: Math.round(plan.price * 100), reference, currency: 'NGN',
      callback_url: `${process.env.NEXTAUTH_URL}/exam-prep/subscribe/verify`,
      metadata: { type: 'exam_prep_subscription', regNumber, duration, price: plan.price },
    }),
  })
  const data = await paystackRes.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })

  return NextResponse.json({ success: true, accessCode: data.data.access_code, reference: data.data.reference, publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, amount: plan.price, email })
}