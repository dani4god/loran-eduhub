// app/api/tutors/all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'
import Review from '@/models/Review'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const tutors = await Tutor.find({ status: 'approved' })
      .populate('courses')
      .lean()

    if (!tutors || tutors.length === 0) {
      return NextResponse.json({
        success: true,
        tutors: [],
        count: 0,
        message: 'No tutors available',
      })
    }

    const tutorIds = tutors.map((t: any) => t._id)
    const ratingAgg = await Review.aggregate([
      { $match: { tutorId: { $in: tutorIds } } },
      { $group: { _id: '$tutorId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    const ratingByTutor = new Map(
      ratingAgg.map((r: any) => [
        r._id.toString(),
        { average: Math.round(r.avg * 10) / 10, count: r.count },
      ])
    )

    const formattedTutors = tutors.map((tutor: any) => ({
      _id: tutor._id,
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      bio: tutor.bio || '',
      profileImage: tutor.profileImage || null,
      slug: tutor.slug,
      pricing: tutor.pricing || null,
      rating: ratingByTutor.get(tutor._id.toString()) || { average: 0, count: 0 },
      courses: (tutor.courses || []).map((course: any) => ({
        _id: course._id,
        name: course.name,
        category: course.category,
      })),
    }))

    return NextResponse.json({
      success: true,
      tutors: formattedTutors,
      count: formattedTutors.length,
    })
  } catch (error) {
    console.error('Error fetching tutors:', error)
    return NextResponse.json(
      { success: false, tutors: [], error: 'Failed to fetch tutors' },
      { status: 500 }
    )
  }
}