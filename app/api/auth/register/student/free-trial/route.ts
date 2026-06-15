// app/api/students/free-trial/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await connectDB()

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      // User doesn't exist yet, so no free trial used
      return NextResponse.json({ 
        hasUsedFreeTrial: false,
        message: 'New user - free trial available'
      })
    }

    // Find the student record
    const student = await Student.findOne({ userId: user._id })
    
    if (!student) {
      return NextResponse.json({ 
        hasUsedFreeTrial: false,
        message: 'Student record not found - free trial available'
      })
    }

    return NextResponse.json({ 
      hasUsedFreeTrial: student.hasUsedFreeTrial || false,
      studentId: student._id,
      message: student.hasUsedFreeTrial ? 'Free trial already used' : 'Free trial available'
    })
  } catch (error) {
    console.error('Error checking free trial:', error)
    return NextResponse.json({ 
      hasUsedFreeTrial: false,
      error: 'Failed to check free trial status'
    }, { status: 500 })
  }
}