// app/api/admin/exam-prep/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import ExamPrepSettings from '@/models/ExamPrepSettings'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const settings = await ExamPrepSettings.findOneAndUpdate({ key: 'global' }, {}, { upsert: true, returnDocument: 'after' })
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { isLocked, isPaid, plans } = await req.json()
  await connectDB()
  const update: any = {}
  if (isLocked !== undefined) update.isLocked = isLocked
  if (isPaid !== undefined) update.isPaid = isPaid
  if (plans !== undefined) update.plans = plans
  const settings = await ExamPrepSettings.findOneAndUpdate({ key: 'global' }, update, { upsert: true, returnDocument: 'after' })
  return NextResponse.json({ success: true, settings })
}