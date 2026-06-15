// app/api/auth/check-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })
    
    return NextResponse.json({ 
      exists: !!user,
      email: email.toLowerCase()
    })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 })
  }
}