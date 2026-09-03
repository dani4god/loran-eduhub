//app/api/exam-prep/plans/route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepSettings from '@/models/ExamPrepSettings'

export async function GET() {
  await connectDB()
  const settings = await ExamPrepSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { upsert: true, new: true }
  ).lean()

  return NextResponse.json({
    isLocked: !!settings?.isLocked,
    isPaid: !!settings?.isPaid,
    plans: (settings?.plans || []).filter((plan: any) => plan.enabled),
  })
}
