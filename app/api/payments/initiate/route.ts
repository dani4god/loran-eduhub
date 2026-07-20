//payments/initiate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { computeSelectionsAmount } from '@/lib/pricing'
import { PlanType } from '@/lib/constants'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    const { email, plan, selections } = body

    if (!email || !plan) {
      return NextResponse.json({ error: 'Email and plan are required' }, { status: 400 })
    }

    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: 'Paystack not configured on server' }, { status: 500 })
    }

    if (plan === 'trial') {
      return NextResponse.json({ success: true, isTrial: true, requiresPayment: false })
    }

    if (!selections?.length) {
      return NextResponse.json({ error: 'No courses selected' }, { status: 400 })
    }

    // Server recomputes the amount from each tutor's own pricing —
    // whatever the client sent is ignored entirely.
    let total: number
    try {
      const result = await computeSelectionsAmount(selections, plan as PlanType)
      total = result.total
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    if (total <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const reference = `LORAN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(total * 100),
        reference,
        currency: 'NGN',
        callback_url: `${process.env.NEXTAUTH_URL}/payment/verify`,
        metadata: { plan, courseCount: selections.length, email },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Paystack initialization failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      requiresPayment: true,
      isTrial: false,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
      authorizationUrl: paystackData.data.authorization_url,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      amount: total, // server-computed — the client should display this, not its own guess
      email,
    })
  } catch (error: any) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to initialize payment' }, { status: 500 })
  }
}