// app/api/tutors/all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    
    // Get all approved tutors with their courses populated
    const tutors = await Tutor.find({ status: 'approved' })
      .populate('courses')
      .lean()

    if (!tutors || tutors.length === 0) {
      return NextResponse.json({
        success: true,
        tutors: [],
        count: 0,
        message: 'No tutors available'
      })
    }

    // Format the response
    const formattedTutors = tutors.map(tutor => ({
      _id: tutor._id,
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      bio: tutor.bio || '',
      profileImage: tutor.profileImage || null,
      slug: tutor.slug,
      courses: (tutor.courses || []).map((course: any) => ({
        _id: course._id,
        name: course.name,
        category: course.category,
      }))
    }))

    return NextResponse.json({
      success: true,
      tutors: formattedTutors,
      count: formattedTutors.length
    })
    
  } catch (error) {
    console.error('Error fetching tutors:', error)
    return NextResponse.json(
      { 
        success: false, 
        tutors: [],
        error: 'Failed to fetch tutors' 
      },
      { status: 500 }
    )
  }
}