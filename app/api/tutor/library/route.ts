// app/api/tutor/library/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import CourseMaterial from '@/models/CourseMaterial'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  const query: any = { tutorId: tutor._id }
  if (courseId) query.courseId = courseId

  const materials = await CourseMaterial.find(query)
    .select('title description status courseId createdAt updatedAt chapters')
    .populate('courseId', 'name category')
    .sort({ updatedAt: -1 })

  const withStats = materials.map(m => ({
    _id: m._id,
    title: m.title,
    description: m.description,
    status: m.status,
    course: m.courseId,
    chapterCount: m.chapters.length,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }))

  return NextResponse.json({ materials: withStats })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const body = await req.json()
  const { courseId, title, description } = body

  if (!courseId || !title) {
    return NextResponse.json({ error: 'courseId and title are required' }, { status: 400 })
  }

  const teachesCourse = tutor.courses.some((c: any) => c.toString() === courseId)
  if (!teachesCourse) {
    return NextResponse.json({ error: 'You do not teach this course' }, { status: 403 })
  }

  const material = await CourseMaterial.create({
    tutorId: tutor._id,
    courseId,
    title,
    description: description || '',
    status: 'draft',
    chapters: [],
  })

  return NextResponse.json({ success: true, material })
}