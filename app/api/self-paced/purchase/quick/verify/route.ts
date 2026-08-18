// app/api/self-paced/purchase/quick/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import { syncSelfPacedStudentDiscordRoles } from '@/lib/discordSync'

async function verifyWithPaystack(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  return res.json()
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  if (!reference) return NextResponse.json({ error: 'Reference is required' }, { status: 400 })

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const verification = await verifyWithPaystack(reference)
  if (!verification.data || verification.data.status !== 'success') {
    return NextResponse.json({ error: `Payment not confirmed (status: ${verification.data?.status ?? 'unknown'})` }, { status: 400 })
  }

  const { courseId } = verification.data.metadata || {}
  const amountPaid = verification.data.amount / 100

  const existing = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId })
  if (existing) return NextResponse.json({ success: true, alreadyProcessed: true })

  const SelfPacedCourse = (await import('@/models/SelfPacedCourse')).default
  const course = await SelfPacedCourse.findById(courseId)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  await SelfPacedEnrollment.create({
    selfPacedStudentId: student._id,
    courseId,
    tutorId: course.tutorId,
    amountPaid,
    paystackReference: reference,
    weekProgress: [],
  })

  if (student.discordId) {
    await syncSelfPacedStudentDiscordRoles(student._id.toString(), student.discordId).catch(() => {})
  }

  return NextResponse.json({ success: true, alreadyProcessed: false })
}