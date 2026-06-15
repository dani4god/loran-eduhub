// app/api/tutors/by-courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    
    const { courseIds } = await req.json()
    
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course IDs are required' },
        { status: 400 }
      )
    }

    // Get all courses with their tutors
    const coursesWithTutors = []

    for (const courseId of courseIds) {
      // Get course details
      const course = await Course.findById(courseId).lean()
      
      if (!course) continue
      
      // Find tutors who teach this course
      const tutors = await Tutor.find({
        courses: { $in: [courseId] },
        status: 'approved'
      }).lean()
      
      coursesWithTutors.push({
        courseId: course._id,
        courseName: course.name,
        courseCategory: course.category,
        tutors: tutors.map(tutor => ({
          _id: tutor._id,
          firstName: tutor.firstName,
          lastName: tutor.lastName,
          bio: tutor.bio || '',
          profileImage: tutor.profileImage || null,
          slug: tutor.slug,
        }))
      })
    }

    return NextResponse.json({
      success: true,
      courses: coursesWithTutors
    })
    
  } catch (error) {
    console.error('Error fetching tutors by courses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tutors' },
      { status: 500 }
    )
  }
}