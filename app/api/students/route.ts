import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import { addDays } from 'date-fns'

const PLAN_DURATIONS: Record<string, number> = {
  trial: 7,
  '3months': 90,
  '6months': 180,
  '1year': 365,
}

const PLAN_PRICES: Record<string, number> = {
  trial: 0,
  '3months': 45000,
  '6months': 80000,
  '1year': 150000,
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      state,
      dateOfBirth,
      password,
      plan,
      selections, // Array of { tutorId, courseId }
    } = body

    // ── Validate required fields ──
    if (!firstName || !lastName || !email || !phone || !state || !password || !plan) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    if (!selections || selections.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one tutor and course' },
        { status: 400 }
      )
    }

    if (!PLAN_DURATIONS[plan]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    // ── Check email not already registered ──
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // ── Create user ──
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
    })

    // ── Create student profile ──
    const student = await Student.create({
      userId: user._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      state,
      dateOfBirth: dateOfBirth || undefined,
      hasUsedFreeTrial: plan === 'trial',
    })

    // ── Create enrollments for each tutor/course selection ──
    const startDate = new Date()
    const endDate = addDays(startDate, PLAN_DURATIONS[plan])
    const enrollmentIds = []

    for (const selection of selections) {
      const { tutorId, courseId } = selection

      if (!tutorId || !courseId) continue

      // Check if student already enrolled in this course with this tutor
      const existingEnrollment = await Enrollment.findOne({
        studentId: student._id,
        tutorId,
        courseId,
      })
      if (existingEnrollment) continue

      const enrollment = await Enrollment.create({
        studentId: student._id,
        tutorId,
        courseId,
        plan,
        // Trial is immediately active, paid plans pending payment
        status: plan === 'trial' ? 'active' : 'pending',
        startDate,
        endDate,
      })

      enrollmentIds.push(enrollment._id)
    }

    // ── Link enrollments to student ──
    await Student.findByIdAndUpdate(student._id, {
      $push: { enrollments: { $each: enrollmentIds } },
    })

    // ── Response ──
    return NextResponse.json(
      {
        success: true,
        userId: user._id,
        studentId: student._id,
        enrollmentIds,
        requiresPayment: plan !== 'trial',
        amount: PLAN_PRICES[plan],
        plan,
        message:
          plan === 'trial'
            ? 'Account created! Your free trial is now active.'
            : 'Account created! Please complete payment to activate your enrollment.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Clean up user if student creation failed
    console.error('Student registration error:', error)

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}

// GET - Check if email is already registered (used for real-time validation)
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() })
    return NextResponse.json({ exists: !!exists })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}