// app/api/tutor/self-paced-courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'

async function getOwnedCourse(id: string, userId: string) {
  const tutor = await Tutor.findOne({ userId })
  if (!tutor) return { error: 'Tutor not found', status: 404 as const }
  const course = await SelfPacedCourse.findById(id)
  if (!course) return { error: 'Course not found', status: 404 as const }
  if (course.tutorId.toString() !== tutor._id.toString()) return { error: 'Forbidden', status: 403 as const }
  return { course, tutor }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const result = await getOwnedCourse(id, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json({ course: result.course })
}

// Used for autosave — accepts a partial update, saves whatever fields
// are present (title, description, coverImageUrl, price, weeks,
// coaching/discord/workshop settings, certificate assets).
// app/api/tutor/self-paced-courses/[id]/route.ts — PATCH handler, full replacement

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const result = await getOwnedCourse(id, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const course = result.course

  // A published (live, student-facing) course cannot be edited directly —
  // it must be unpublished first. This prevents content/exam questions
  // from shifting under students mid-course.
  if (course.status === 'published') {
    return NextResponse.json(
      { error: 'This course is published and cannot be edited. Unpublish it first, make your changes, then submit for review again.' },
      { status: 400 }
    )
  }

  const body = await req.json()
  const allowedFields = [
    'title', 'description', 'coverImageUrl', 'price', 'weeks',
    'coachingEnabled', 'coachingHourlyRate', 'discordEnabled', 'discordDescription',
    'weeklyWorkshop', 'certificateSignatureUrl', 'certificateLogoUrl',
  ]

  const update: any = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) update[field] = body[field]
  }

  const updated = await SelfPacedCourse.findByIdAndUpdate(id, update, { new: true })
  return NextResponse.json({ success: true, savedAt: new Date().toISOString(), course: updated })
}

// app/api/tutor/self-paced-courses/[id]/route.ts — DELETE handler, unchanged from earlier,
// re-pasted for clarity that NO status check blocks deletion — only enrollment count does:

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const result = await getOwnedCourse(id, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const activeCount = await SelfPacedEnrollment.countDocuments({ courseId: id })
  if (activeCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${activeCount} student(s) have purchased this course. Unpublish it instead.` },
      { status: 400 }
    )
  }

  await SelfPacedCourse.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}