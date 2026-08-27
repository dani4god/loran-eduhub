// app/api/exam-prep/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'

export async function POST(req: NextRequest) {
  const { regNumber } = await req.json()
  if (!regNumber?.trim()) return NextResponse.json({ error: 'Registration number is required' }, { status: 400 })

  await connectDB()
  const student = await ExamPrepStudent.findOne({ regNumber: regNumber.trim() })
  if (!student) return NextResponse.json({ error: 'Registration number not found' }, { status: 404 })

  const sub = await ExamPrepSubscription.findOne({ examPrepStudentId: student._id })
  const settings = await ExamPrepSettings.findOne({ key: 'global' })

  const locked = settings?.isLocked ?? true
  const hasAccess = sub?.wasFreeAtRegistration || (sub?.endDate ? sub.endDate > new Date() : sub?.planDuration === 'life')

  // A simple signed cookie-free session token — no full auth system needed
  // for a free practice tool; regNumber itself acts as the credential,
  // matching the "enter your reg number" flow you described.
  return NextResponse.json({
    success: true,
    student: { _id: student._id.toString(), regNumber: student.regNumber, fullName: student.fullName },
    locked,
    hasAccess: !!hasAccess,
    requiresPayment: !sub?.wasFreeAtRegistration && !hasAccess,
  })
}