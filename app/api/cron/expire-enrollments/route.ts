// app/api/cron/expire-enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Student from '@/models/Student'
import { syncStudentDiscordRoles } from '@/lib/discordSync'

// Vercel Cron (and most schedulers) call this on a timer — protect it with
// a shared secret so it can't be triggered by anyone who guesses the URL.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const now = new Date()

  // Find every ACTIVE enrollment whose paid period has already ended.
  const expiring = await Enrollment.find({
    status: 'active',
    endDate: { $lte: now },
  })

  if (expiring.length === 0) {
    return NextResponse.json({ success: true, expired: 0, resynced: 0 })
  }

  // Flip status first — before touching Discord — so the role sync below
  // reads the updated status.
  await Enrollment.updateMany(
    { _id: { $in: expiring.map((e: any) => e._id) } },
    { status: 'expired' }
  )

  // Re-sync Discord roles once per affected student (not once per
  // enrollment — a student may have had 2 courses expire in the same run).
  const studentIds = Array.from(new Set(expiring.map((e: any) => e.studentId.toString())))
  let resynced = 0

  for (const studentId of studentIds) {
    try {
      const student = await Student.findById(studentId).select('discordId')
      if (student?.discordId) {
        await syncStudentDiscordRoles(studentId, student.discordId)
        resynced++
      }
    } catch (err) {
      console.error(`Failed to re-sync Discord for student ${studentId} after expiry:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    expired: expiring.length,
    affectedStudents: studentIds.length,
    resynced,
  })
}