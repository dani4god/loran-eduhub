// app/api/tutor/self-paced-courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, category } = await req.json()
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const course = await SelfPacedCourse.create({
    tutorId: tutor._id,
    title: title.trim(),
    category: category || '',
    weeks: [],
    status: 'draft',
  })

  return NextResponse.json({ success: true, courseId: course._id.toString() })
}