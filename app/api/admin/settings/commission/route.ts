// app/api/admin/settings/commission/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getCommissionRate, setCommissionRate } from '@/lib/payout'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rate = await getCommissionRate()
  return NextResponse.json({ commissionRate: rate })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { percent } = await req.json()
  if (typeof percent !== 'number' || percent < 0 || percent > 100) {
    return NextResponse.json({ error: 'Percent must be between 0 and 100' }, { status: 400 })
  }

  const rate = await setCommissionRate(percent / 100)
  return NextResponse.json({ success: true, commissionRate: rate })
}