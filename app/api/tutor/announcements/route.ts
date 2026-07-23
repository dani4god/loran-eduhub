// app/api/tutor/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'
import Announcement from '@/models/Announcement'

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

  const announcements = await Announcement.find({ tutorId: tutor._id })
    .populate('courseId', 'name')
    .sort({ createdAt: -1 })
    .limit(50)

  return NextResponse.json({
    announcements: announcements.map((a: any) => ({
      _id: a._id.toString(),
      courseName: a.courseId?.name || 'Unknown Course',
      title: a.title,
      message: a.message,
      links: a.links,
      scheduledAt: a.scheduledAt || null,
      createdAt: a.createdAt,
    })),
  })
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

  const { courseId, title, message, links, scheduledAt } = await req.json()

  if (!courseId || !title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'courseId, title, and message are required' }, { status: 400 })
  }

  const teachesCourse = tutor.courses.some((c: any) => c.toString() === courseId)
  if (!teachesCourse) {
    return NextResponse.json({ error: 'You do not teach this course' }, { status: 403 })
  }

  const course = await Course.findById(courseId).select('name')
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const validLinks = (links || [])
    .filter((l: any) => l.label?.trim() && l.url?.trim())
    .map((l: any) => ({ label: l.label.trim(), url: l.url.trim() }))

  const announcement = await Announcement.create({
    tutorId: tutor._id,
    courseId,
    title: title.trim(),
    message: message.trim(),
    links: validLinks,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  })

  return NextResponse.json({ success: true, announcementId: announcement._id.toString() })
}