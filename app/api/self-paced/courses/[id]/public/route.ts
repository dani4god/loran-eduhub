// app/api/self-paced/courses/[id]/public/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import Tutor from '@/models/Tutor'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()

  const course = await SelfPacedCourse.findById(id)
  if (!course || course.status !== 'published') {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const tutor = await Tutor.findById(course.tutorId).select('firstName lastName bio profileImage')

  // app/api/self-paced/courses/[id]/public/route.ts — update the returned JSON

  return NextResponse.json({
    _id: course._id.toString(),
    title: course.title,
    description: course.description,
    coverImageUrl: course.coverImageUrl,
    previewVideoUrl: course.previewVideoUrl || null, // ← added
    price: course.price,
    isFree: course.price === 0,
    category: course.category,
    coachingEnabled: course.coachingEnabled,
    discordEnabled: course.discordEnabled,
    weeklyWorkshop: course.weeklyWorkshop,
    tutor: tutor ? {
      firstName: tutor.firstName, lastName: tutor.lastName,
      bio: tutor.bio, profileImage: tutor.profileImage,
    } : null,
    // Full table of contents — week + page titles, no content/exam data
    // leaked before purchase.
    modules: course.weeks.map((w: any) => ({
      weekNumber: w.weekNumber,
      title: w.title,
      pageTitles: (w.pages || []).map((p: any) => p.title),
      questionCount: w.exam.questions.length,
      durationMinutes: w.exam.durationMinutes,
    })),
  })
}