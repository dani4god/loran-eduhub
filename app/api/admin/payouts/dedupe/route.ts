// app/api/admin/payouts/dedupe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import PayoutLog from '@/models/PayoutLog'

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const groups = await PayoutLog.aggregate([
    { $group: { _id: { paymentId: '$paymentId', tutorId: '$tutorId', courseId: '$courseId' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ])

  let removed = 0
  let resetToPending = 0

  for (const group of groups) {
    const [keepId, ...removeIds] = group.ids // keeps the oldest (first created)
    await PayoutLog.deleteMany({ _id: { $in: removeIds } })
    removed += removeIds.length

    // Any leftover "failed"/"processing" state on the kept row was caused
    // by the now-removed automated transfer attempt — reset it to pending
    // so it's correctly awaiting manual payout instead of stuck as failed.
    const kept = await PayoutLog.findById(keepId)
    if (kept && kept.status !== 'paid') {
      kept.status = 'pending'
      kept.failureReason = undefined
      kept.paystackTransferCode = undefined
      kept.paystackTransferReference = undefined
      await kept.save()
      resetToPending++
    }
  }

  return NextResponse.json({ success: true, duplicateGroupsFound: groups.length, removed, resetToPending })
}