// app/api/auth/register/student/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import Tutor from '@/models/Tutor'
import { PLAN_PRICES, PLAN_DURATIONS } from '@/lib/constants'
import mongoose from 'mongoose'

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
      selections,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !state || !password || !plan || !selections?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check free trial eligibility
    if (plan === 'trial') {
      const existingTrial = await Student.findOne({ hasUsedFreeTrial: true })
      if (existingTrial) {
        // This check needs to be per student, will be set after creation
      }
    }

    // Calculate total amount based on number of courses
    const courseCount = selections.length
    const basePrice = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
    const totalAmount = basePrice * courseCount

    // Start a session for transaction
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // Create User
      const hashedPassword = await bcrypt.hash(password, 10)
      const userResult = await User.create([{
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        isActive: true,
      }], { session })
      const user = userResult as any

      // Create Student
      const studentDoc: any = {
        userId: user[0]._id,
        firstName,
        lastName,
        phone,
        state,
        hasUsedFreeTrial: plan === 'trial',
        enrollments: [],
      }

      if (dateOfBirth) {
        studentDoc.dateOfBirth = new Date(dateOfBirth)
      }

      const studentResult = await Student.create([studentDoc], { session })
      const student = studentResult as any

      // Create enrollments for each selected course
      const enrollments = []
      for (const selection of selections) {
        const course = await Course.findById(selection.courseId).session(session)
        const tutor = await Tutor.findById(selection.tutorId).session(session)

        if (!course || !tutor) {
          throw new Error(`Invalid course or tutor for selection: ${selection.courseId}`)
        }

        const startDate = new Date()
        const durationDays = PLAN_DURATIONS[plan as keyof typeof PLAN_DURATIONS]
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + durationDays)

        const enrollment = await Enrollment.create([{
          studentId: student[0]._id,
          tutorId: selection.tutorId,
          courseId: selection.courseId,
          plan,
          status: plan === 'trial' ? 'active' : 'pending',
          startDate,
          endDate,
          amount: basePrice,
        }], { session })

        enrollments.push(enrollment[0])
      }

      // Update student with enrollments
      await Student.updateOne(
        { _id: student[0]._id },
        { $push: { enrollments: { $each: enrollments.map(e => e._id) } } }
      ).session(session)

      await session.commitTransaction()

      // If trial, directly activate; else redirect to payment
      if (plan === 'trial') {
        return NextResponse.json({
          success: true,
          studentId: student[0]._id,
          requiresPayment: false,
          message: 'Free trial activated successfully',
        })
      }

      return NextResponse.json({
        success: true,
        studentId: student[0]._id,
        requiresPayment: true,
        amount: totalAmount,
        plan,
        enrollments: enrollments.map(e => e._id),
      })

    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    )
  }
}