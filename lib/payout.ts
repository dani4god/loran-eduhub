// lib/payout.ts
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import PayoutLog from '@/models/PayoutLog'
import PlatformSettings from '@/models/PlatformSettings'

export const DEFAULT_COMMISSION_RATE = 0.15

export async function getCommissionRate(): Promise<number> {
  await connectDB()
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { commissionRate: DEFAULT_COMMISSION_RATE } },
    { upsert: true, new: true }
  )
  return settings.commissionRate
}

export async function setCommissionRate(rate: number): Promise<number> {
  await connectDB()
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { commissionRate: rate },
    { upsert: true, new: true }
  )
  return settings.commissionRate
}

// Scans successful Payments that haven't been broken into PayoutLog rows
// yet. Each Payment is atomically "claimed" via findOneAndUpdate BEFORE any
// PayoutLog rows are created — so if this function runs concurrently from
// two requests (e.g. the admin payouts page and the tutor payments page
// loading at the same moment), only one of them wins the claim and the
// other skips it entirely. The unique index on PayoutLog is a second,
// belt-and-suspenders guard against the same race.
export async function ensurePayoutLogs(): Promise<void> {
  await connectDB()
  const rate = await getCommissionRate()

  const unprocessed = await Payment.find({ status: 'success', payoutLogged: { $ne: true } })

  for (const payment of unprocessed as any[]) {
    const claimed = await Payment.findOneAndUpdate(
      { _id: payment._id, payoutLogged: { $ne: true } },
      { payoutLogged: true },
      { new: true }
    )
    if (!claimed) continue // another concurrent call already claimed this one

    for (const detail of payment.courseDetails || []) {
      const gross = detail.planPrice
      const commission = Math.round(gross * rate)
      const net = gross - commission

      try {
        await PayoutLog.create({
          paymentId: payment._id,
          studentId: payment.studentId,
          tutorId: detail.tutorId,
          courseId: detail.courseId,
          grossAmount: gross,
          commissionRate: rate,
          commissionAmount: commission,
          netAmount: net,
          status: 'pending',
        })
      } catch (err: any) {
        if (err.code !== 11000) throw err // ignore duplicate-key races only
      }
    }
  }
}