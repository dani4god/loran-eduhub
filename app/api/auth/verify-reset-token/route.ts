// app/api/auth/verify-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const role = searchParams.get('role')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    if (role && user.role !== role) {
      return NextResponse.json(
        { error: 'Invalid token for this account type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      role: user.role,
    })
  } catch (error: any) {
    console.error('Verify token error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}