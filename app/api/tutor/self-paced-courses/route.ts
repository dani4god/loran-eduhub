// app/api/tutor/self-paced-courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import Course from '@/models/Course'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const courses = await SelfPacedCourse.find({ tutorId: tutor._id })
    .select('title coverImageUrl price status weeks createdAt updatedAt')
    .sort({ updatedAt: -1 })

  return NextResponse.json({
    courses: courses.map((c: any) => ({
      _id: c._id.toString(),
      title: c.title,
      coverImageUrl: c.coverImageUrl,
      price: c.price,
      status: c.status,
      weekCount: c.weeks.length,
      updatedAt: c.updatedAt,
    })),
  })
}

// app/api/tutor/self-paced-courses/route.ts — POST handler only, GET unchanged


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, courseId } = await req.json()
  if (!title?.trim() || !courseId) {
    return NextResponse.json({ error: 'Title and course selection are required' }, { status: 400 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const teachesCourse = tutor.courses.some((c: any) => c.toString() === courseId)
  if (!teachesCourse) {
    return NextResponse.json({ error: 'You can only create a self-paced version of a course you teach' }, { status: 403 })
  }

  const course = await Course.findById(courseId).select('category')
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const spCourse = await SelfPacedCourse.create({
    tutorId: tutor._id,
    title: title.trim(),
    sourceCourseId: courseId,
    category: course.category, // locked at creation, never editable afterward
    weeks: [],
    status: 'draft',
  })

  return NextResponse.json({ success: true, courseId: spCourse._id.toString() })
}