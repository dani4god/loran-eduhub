// app/api/tutors/[tutorId]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import Course from '@/models/Course'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const { tutorId } = await params
  await connectDB()

  const reviews = await Review.find({ tutorId }).sort({ createdAt: -1 }).limit(50)

  const courseIds = Array.from(new Set(reviews.map((r: any) => r.courseId.toString())))
  const courses = await Course.find({ _id: { $in: courseIds } }).select('name')
  const courseById = new Map(courses.map((c: any) => [c._id.toString(), c.name]))

  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0

  return NextResponse.json({
    summary: { average, count: reviews.length },
    reviews: reviews.map((r: any) => ({
      _id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      studentDisplayName: r.studentDisplayName,
      courseName: courseById.get(r.courseId.toString()) || '',
      createdAt: r.createdAt,
    })),
  })
}