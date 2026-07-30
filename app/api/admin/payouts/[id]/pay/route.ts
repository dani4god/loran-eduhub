// app/api/admin/payouts/[id]/pay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import PayoutLog from '@/models/PayoutLog'

// No Paystack Transfer call here — Paystack Transfers require a fully
// activated business account and return an error on Starter/test-mode
// accounts. This now just records that the admin paid the tutor manually
// (bank transfer, etc.) outside the platform.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const payout = await PayoutLog.findById(id)
  if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
  if (payout.status === 'paid') return NextResponse.json({ error: 'Already marked as paid' }, { status: 400 })

  payout.status = 'paid'
  payout.paidAt = new Date()
  payout.failureReason = undefined
  await payout.save()

  return NextResponse.json({ success: true, payout })
}