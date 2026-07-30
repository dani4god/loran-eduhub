// app/api/tutor/bank/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import crypto from 'crypto'
import { listNigerianBanks, resolveAccountNumber } from '@/lib/paystackTransfer'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id }).select('bankDetails')
  const banks = await listNigerianBanks().catch(() => [])

  return NextResponse.json({ bankDetails: tutor?.bankDetails || null, banks })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { otp, bankName, bankCode, accountNumber } = await req.json()
  if (!otp || !bankName || !bankCode || !accountNumber) {
    return NextResponse.json({ error: 'All fields including the verification code are required' }, { status: 400 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  if (!tutor.bankUpdateOtpHash || !tutor.bankUpdateOtpExpires || tutor.bankUpdateOtpExpires < new Date()) {
    return NextResponse.json({ error: 'Verification code expired. Please request a new one.' }, { status: 400 })
  }

  const hash = crypto.createHash('sha256').update(otp).digest('hex')
  if (hash !== tutor.bankUpdateOtpHash) {
    return NextResponse.json({ error: 'Incorrect verification code' }, { status: 400 })
  }

  let accountName: string
  try {
    const resolved = await resolveAccountNumber(accountNumber, bankCode)
    accountName = resolved.account_name
  } catch (err: any) {
    return NextResponse.json({ error: `Could not verify account: ${err.message}` }, { status: 400 })
  }

  tutor.bankDetails = {
    bankName, bankCode, accountNumber, accountName,
    paystackRecipientCode: undefined, // force recreation on next payout since details changed
  }
  tutor.bankUpdateOtpHash = undefined
  tutor.bankUpdateOtpExpires = undefined
  await tutor.save()

  return NextResponse.json({ success: true, bankDetails: tutor.bankDetails })
}