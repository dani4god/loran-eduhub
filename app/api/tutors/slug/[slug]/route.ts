// app/api/tutors/slug/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Review from '@/models/Review'
import Course from '@/models/Course'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  await connectDB()

  const tutor = await Tutor.findOne({ slug, status: 'approved' }).populate('courses', 'name category')
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const reviews = await Review.find({ tutorId: tutor._id }).sort({ createdAt: -1 }).limit(50)
  const courseIds = Array.from(new Set(reviews.map((r: any) => r.courseId.toString())))
  const reviewCourses = await Course.find({ _id: { $in: courseIds } }).select('name')
  const courseNameById = new Map(reviewCourses.map((c: any) => [c._id.toString(), c.name]))

  const average = reviews.length > 0
    ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  return NextResponse.json({
    tutor: {
      _id: tutor._id.toString(),
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      bio: tutor.bio,
      profileImage: tutor.profileImage || null,
      slug: tutor.slug,
      pricing: tutor.pricing,
      socialLinks: tutor.socialLinks || [],
      courses: (tutor.courses as any[]).map((c) => ({ _id: c._id.toString(), name: c.name, category: c.category })),
      introVideoUrl: tutor.introVideoUrl || null,
    },
    rating: { average, count: reviews.length },
    reviews: reviews.map((r: any) => ({
      _id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      studentDisplayName: r.studentDisplayName,
      courseName: courseNameById.get(r.courseId.toString()) || '',
      createdAt: r.createdAt,
    })),
    campaignMessages: (tutor.campaignMessages || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((m: any) => ({ message: m.message, createdAt: m.createdAt })),
  })
}