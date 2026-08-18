// app/api/self-paced/courses/route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import Tutor from '@/models/Tutor'

export async function GET() {
  await connectDB()
  const courses = await SelfPacedCourse.find({ status: 'published' })
    .select('title description coverImageUrl price category tutorId weeks')
    .sort({ createdAt: -1 })

  const tutorIds = [...new Set(courses.map((c: any) => c.tutorId.toString()))]
  const tutors = await Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName')
  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))

  return NextResponse.json({
    courses: courses.map((c: any) => ({
      _id: c._id.toString(),
      title: c.title,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      price: c.price,
      isFree: c.price === 0,
      category: c.category,
      weekCount: c.weeks.length,
      tutorName: tutorById.get(c.tutorId.toString())
        ? `${tutorById.get(c.tutorId.toString())!.firstName} ${tutorById.get(c.tutorId.toString())!.lastName}`
        : 'Unknown Tutor',
    })),
  })
}