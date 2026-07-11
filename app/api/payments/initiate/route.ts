import { NextRequest, NextResponse } from 'next/server'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      email,
      amount,
      plan,
      selections, // [{ courseId, tutorId, courseName, tutorName }]
      personalData, // { firstName, lastName, phone, state, dateOfBirth }
    } = body

    if (!email || !plan) {
      return NextResponse.json(
        { error: 'Email and plan are required' },
        { status: 400 }
      )
    }

    if (!PAYSTACK_SECRET) {
      return NextResponse.json(
        { error: 'Paystack not configured on server' },
        { status: 500 }
      )
    }

    // Trial needs no payment — signal that to the client
    if (plan === 'trial') {
      return NextResponse.json({
        success: true,
        isTrial: true,
        requiresPayment: false,
      })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!selections?.length) {
      return NextResponse.json(
        { error: 'No courses selected' },
        { status: 400 }
      )
    }

    // Generate a unique reference for this transaction
    const reference = `LORAN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // kobo
        reference,
        currency: 'NGN',
        callback_url: `${process.env.NEXTAUTH_URL}/payment/verify`,
        metadata: {
          // Store everything needed to create the account after payment
          plan,
          courseCount: selections.length,
          email,
        },
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
      amount,
      email,
    })
  } catch (error: any) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}