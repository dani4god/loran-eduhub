// app/api/tutor/bank/request-otp/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import crypto from 'crypto'
import { sendBankUpdateOtpEmail } from '@/lib/email'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const otp = Math.floor(10000000 + Math.random() * 90000000).toString() // 8 digits
  const hash = crypto.createHash('sha256').update(otp).digest('hex')

  tutor.bankUpdateOtpHash = hash
  tutor.bankUpdateOtpExpires = new Date(Date.now() + 10 * 60 * 1000)
  await tutor.save()

  await sendBankUpdateOtpEmail(tutor.email, tutor.firstName, otp)

  return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
}