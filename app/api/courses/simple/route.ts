// app/api/courses/simple/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    
    // Get all active courses
    const courses = await Course.find({ isActive: true }).lean()
    
    return NextResponse.json({
      success: true,
      courses: courses,
      count: courses.length
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      courses: [] 
    }, { status: 500 })
  }
}