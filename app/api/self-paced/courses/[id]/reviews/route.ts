// app/api/self-paced/courses/[id]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SelfPacedCourseReview from '@/models/SelfPacedCourseReview'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()

  const reviews = await SelfPacedCourseReview.find({ courseId: id }).sort({ createdAt: -1 }).limit(50)
  const average = reviews.length > 0 ? Math.round((reviews.reduce((s, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0

  return NextResponse.json({
    average,
    count: reviews.length,
    reviews: reviews.map((r: any) => ({
      _id: r._id.toString(),
      rating: r.rating,
      studentDisplayName: r.studentDisplayName,
      courseExperience: r.courseExperience,
      wouldRecommend: r.wouldRecommend,
      difficultyLevel: r.difficultyLevel,
      mostDifficultConcept: r.mostDifficultConcept,
      weeklyStructureHelpful: r.weeklyStructureHelpful,
      tutorRating: r.tutorRating,
      hadOneOnOneSession: r.hadOneOnOneSession,
      workshopRating: r.workshopRating,
      careerImpact: r.careerImpact,
      platformMessage: r.platformMessage,
      createdAt: r.createdAt,
    })),
  })
}