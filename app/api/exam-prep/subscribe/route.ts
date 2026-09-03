//app/api/exam-prep/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireExamPrepStudent(req)
    if (!auth.ok) return auth.response

    const { planDuration } = await req.json()
    await connectDB()

    const settings = await ExamPrepSettings.findOne({ key: 'global' }).lean()
    if (!settings?.isPaid) {
      return NextResponse.json({ error: 'Exam Prep is currently free.' }, { status: 400 })
    }

    const plan = (settings.plans || []).find((p: any) => p.enabled && p.duration === planDuration)
    if (!plan) return NextResponse.json({ error: 'Invalid subscription plan.' }, { status: 400 })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 500 })

    const reference = `EXAMPREP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    const callbackUrl = `${process.env.NEXTAUTH_URL || ''}/exam-prep/subscribe?reference=${encodeURIComponent(reference)}`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: auth.student.email,
        amount: Math.round(Number(plan.price) * 100),
        currency: 'NGN',
        reference,
        callback_url: callbackUrl || undefined,
        metadata: {
          purpose: 'exam_prep_subscription',
          examPrepStudentId: auth.student._id.toString(),
          planDuration,
        },
      }),
    })

    const data = await response.json()
    if (!response.ok || !data?.status) {
      return NextResponse.json({ error: data?.message || 'Could not initialize payment.' }, { status: 502 })
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference,
      amount: plan.price,
    })
  } catch (error) {
    console.error('Exam Prep subscribe:', error)
    return NextResponse.json({ error: 'Could not initialize subscription.' }, { status: 500 })
  }
}
