// app/api/auth/register/student/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import { PLAN_DURATIONS, PlanType } from '@/lib/constants'
import { computeSelectionsAmount } from '@/lib/pricing'
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

    // Recompute pricing server-side from each tutor's own rates — this also
    // validates that every selected tutor/course exists and has pricing set
    // for the chosen plan, throwing a clear error if not.
    let totalAmount = 0
    let pricedSelections: { courseId: string; tutorId: string; amount: number }[] = []

    if (plan !== 'trial') {
      try {
        const result = await computeSelectionsAmount(selections, plan as PlanType)
        totalAmount = result.total
        pricedSelections = result.amounts
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
    } else {
      pricedSelections = selections.map((s: any) => ({ ...s, amount: 0 }))
    }

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

      // Create enrollments — each locked in at its own tutor's price
      const enrollments = []
      const durationDays = PLAN_DURATIONS[plan as PlanType]

      for (const priced of pricedSelections) {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + durationDays)

        const enrollment = await Enrollment.create([{
          studentId: student[0]._id,
          tutorId: priced.tutorId,
          courseId: priced.courseId,
          plan,
          status: plan === 'trial' ? 'active' : 'pending',
          startDate,
          endDate,
          amount: priced.amount,
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