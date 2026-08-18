// app/api/self-paced/purchase/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import { syncSelfPacedStudentDiscordRoles } from '@/lib/discordSync'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, courseId } = await req.json()

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !password || !courseId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    await connectDB()

    const course = await SelfPacedCourse.findById(courseId)
    if (!course || course.status !== 'published') {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })

    // ── Free course: create the account immediately ──
    if (course.price === 0) {
      let user = existingUser
      let student

      if (user) {
        student = await SelfPacedStudent.findOne({ userId: user._id })
        if (!student) {
          return NextResponse.json(
            { error: 'This email is already registered under a different account type' },
            { status: 400 }
          )
        }
      } else {
        user = await User.create({
          email: email.toLowerCase().trim(),
          password,
          role: 'selfpaced_student',
          isActive: true,
        })
        student = await SelfPacedStudent.create({
          userId: user._id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        })
      }

      const existingEnrollment = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId })
      if (!existingEnrollment) {
        await SelfPacedEnrollment.create({
          selfPacedStudentId: student._id,
          courseId,
          tutorId: course.tutorId,
          amountPaid: 0,
          weekProgress: [],
        })
      }

      // Trigger Discord sync immediately after enrollment
      if (student.discordId) {
        await syncSelfPacedStudentDiscordRoles(student._id.toString(), student.discordId).catch(() => {})
      }

      return NextResponse.json({ success: true, isFree: true, requiresPayment: false })
    }

    // ── Paid course: initialize Paystack, defer account creation until verified ──
    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: 'Paystack not configured on server' }, { status: 500 })
    }
    if (existingUser) {
      const student = await SelfPacedStudent.findOne({ userId: existingUser._id })
      if (!student) {
        return NextResponse.json(
          { error: 'This email is already registered under a different account type' },
          { status: 400 }
        )
      }
      const alreadyEnrolled = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId })
      if (alreadyEnrolled) {
        return NextResponse.json({ error: 'You already own this course' }, { status: 400 })
      }
    }

    const reference = `SP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Math.round(course.price * 100),
        reference,
        currency: 'NGN',
        callback_url: `${process.env.NEXTAUTH_URL}/self-paced/purchase/verify`,
        metadata: { type: 'self_paced_purchase', courseId, firstName, lastName, email, phone, password },
      }),
    })

    const paystackData = await paystackRes.json()
    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message || 'Paystack initialization failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      isFree: false,
      requiresPayment: true,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      amount: course.price,
      email,
    })
  } catch (error: any) {
    console.error('Self-paced purchase initiate error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start purchase' }, { status: 500 })
  }
}