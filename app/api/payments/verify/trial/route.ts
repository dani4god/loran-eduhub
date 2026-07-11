import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import { addDays } from 'date-fns'

const PLAN_DURATIONS = {
  trial: 7,
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      state,
      dateOfBirth,
      selections,
    } = await req.json()

    if (!email || !password || !firstName || !lastName || !selections?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ── Check email not already registered ──
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // ── Check trial hasn't been used before ──
    // (Since account doesn't exist yet, this is their first time)

    // ── Create user ──
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
    })

    // ── Create student ──
    const student = await Student.create({
      userId: user._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      state,
      dateOfBirth: dateOfBirth || undefined,
      hasUsedFreeTrial: true,
    })

    // ── Create enrollments ──
    const groupId = new mongoose.Types.ObjectId()
    const startDate = new Date()
    const endDate = addDays(startDate, PLAN_DURATIONS['trial'])
    const enrollmentIds: mongoose.Types.ObjectId[] = []

    for (const sel of selections) {
      const { courseId, tutorId } = sel
      if (!courseId || !tutorId) continue

      const enrollment = await Enrollment.create({
        studentId: student._id,
        tutorId,
        courseId,
        plan: 'trial',
        status: 'active',
        amount: 0,
        groupId,
        startDate,
        endDate,
        } as any)

      enrollmentIds.push(enrollment._id)
    }

    await Student.findByIdAndUpdate(student._id, {
      $push: { enrollments: { $each: enrollmentIds } },
    })

    return NextResponse.json({
      success: true,
      studentId: student._id.toString(),
      groupId: groupId.toString(),
    })
  } catch (error: any) {
    console.error('Trial account creation error:', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Account creation failed' },
      { status: 500 }
    )
  }
}