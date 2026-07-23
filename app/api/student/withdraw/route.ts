// app/api/student/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import User from '@/models/User'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import WithdrawalFeedback, { WITHDRAWAL_REASONS } from '@/models/WithdrawalFeedback'
import { syncStudentDiscordRoles } from '@/lib/discordSync'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enrollmentId, reason, feedback } = await req.json()

    if (!enrollmentId || !reason) {
      return NextResponse.json({ error: 'enrollmentId and reason are required' }, { status: 400 })
    }

    if (!WITHDRAWAL_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment || enrollment.studentId.toString() !== student._id.toString()) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (!['active', 'paused'].includes(enrollment.status)) {
      return NextResponse.json({ error: 'This enrollment cannot be withdrawn' }, { status: 400 })
    }

    const [course, user] = await Promise.all([
      Course.findById(enrollment.courseId).select('name category'),
      User.findById(student.userId).select('email discordAccessToken'),
    ])

    await WithdrawalFeedback.create({
      studentId: student._id,
      tutorId: enrollment.tutorId,
      courseId: enrollment.courseId,
      enrollmentId: enrollment._id,
      reason,
      feedback: feedback || '',
      studentSnapshot: {
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        email: user?.email || '',
      },
      courseSnapshot: {
        courseName: course?.name || 'Unknown Course',
        plan: enrollment.plan,
        amountPaid: enrollment.amount,
      },
      withdrawnAt: new Date(),
    })

    // Mark status BEFORE re-syncing Discord, so the sync's own DB read of
    // "active" enrollments correctly excludes this one.
    enrollment.status = 'withdrawn'
    enrollment.withdrawnAt = new Date()
    await enrollment.save()

    // Full reconciliation — recomputes the student's ENTIRE role set from
    // their remaining active enrollments, adding what's still valid and
    // removing everything tied to this (now withdrawn) course. Best-effort;
    // failure here doesn't block the withdrawal itself.
    try {
      if (student.discordId) {
        await syncStudentDiscordRoles(
          student._id.toString(),
          student.discordId,
          user?.discordAccessToken || undefined
        )
      }
    } catch (err) {
      console.error('Discord role re-sync on withdrawal failed (non-fatal):', err)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process withdrawal' }, { status: 500 })
  }
}