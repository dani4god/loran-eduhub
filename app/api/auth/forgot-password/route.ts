// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, role } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    // Always return success to avoid revealing whether email exists
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, you will receive a reset link',
      })
    }

    // Check role matches
    if (role && user.role !== role) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, you will receive a reset link',
      })
    }

    // Tutors must be approved to reset password
    if (user.role === 'tutor') {
      const tutor = await Tutor.findOne({ userId: user._id })
      if (tutor && tutor.status !== 'approved') {
        return NextResponse.json({
          success: true,
          message: 'If an account exists, you will receive a reset link',
        })
      }
    }

    // ── Generate token and store in DB ──
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
    })

    // Get the user's name from their profile
    let name = user.email.split('@')[0]
    if (user.role === 'tutor') {
      const tutor = await Tutor.findOne({ userId: user._id })
      if (tutor) name = `${tutor.firstName} ${tutor.lastName}`
    } else if (user.role === 'student') {
      const student = await Student.findOne({ userId: user._id })
      if (student) name = `${student.firstName} ${student.lastName}`
    }

    // Send raw (unhashed) token in URL — we hash it when verifying
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/${user.role}/reset-password?token=${resetToken}`

    await sendPasswordResetEmail({
      email: user.email,
      name,
      resetUrl,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email',
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}