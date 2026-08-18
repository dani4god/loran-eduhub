// app/api/self-paced/purchase/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import { syncSelfPacedStudentDiscordRoles } from '@/lib/discordSync'

async function verifyWithPaystack(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')
    if (!reference) return NextResponse.json({ error: 'Reference is required' }, { status: 400 })

    await connectDB()

    const verification = await verifyWithPaystack(reference)
    if (!verification.data || verification.data.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not confirmed (status: ${verification.data?.status ?? 'unknown'})` },
        { status: 400 }
      )
    }

    const metadata = verification.data.metadata || {}
    const { courseId, firstName, lastName, email, phone, password } = metadata
    const amountPaid = verification.data.amount / 100

    const course = await SelfPacedCourse.findById(courseId)
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (Math.abs(course.price - amountPaid) > 1) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() })
    let student

    if (user) {
      student = await SelfPacedStudent.findOne({ userId: user._id })
      const existingEnrollment = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student?._id, courseId })
      if (existingEnrollment) {
        return NextResponse.json({ success: true, alreadyProcessed: true })
      }
    } else {
      user = await User.create({ email: email.toLowerCase().trim(), password, role: 'selfpaced_student', isActive: true })
      student = await SelfPacedStudent.create({
        userId: user._id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      })
    }

    await SelfPacedEnrollment.create({
      selfPacedStudentId: student!._id,
      courseId,
      tutorId: course.tutorId,
      amountPaid,
      paystackReference: reference,
      weekProgress: [],
    })

    // Trigger Discord sync immediately after enrollment
    if (student!.discordId) {
      await syncSelfPacedStudentDiscordRoles(student!._id.toString(), student!.discordId).catch(() => {})
    }

    return NextResponse.json({ success: true, alreadyProcessed: false })
  } catch (error: any) {
    console.error('Self-paced purchase verify error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}