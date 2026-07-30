// app/api/admin/courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  await connectDB()

  const course = await Course.findById(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  if (body.name !== undefined) course.name = body.name.trim()
  if (body.description !== undefined) course.description = body.description.trim()
  if (body.category !== undefined) course.category = body.category.trim()
  if (body.discordRoleGroup !== undefined) course.discordRoleGroup = body.discordRoleGroup.trim()
  if (body.syllabus !== undefined) {
    course.syllabus = body.syllabus.filter((s: string) => s.trim()).map((s: string) => s.trim())
  }
  if (body.isActive !== undefined) course.isActive = body.isActive

  await course.save()
  return NextResponse.json({ success: true, course })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const activeCount = await Enrollment.countDocuments({
    courseId: id,
    status: { $in: ['active', 'paused'] },
  })
  if (activeCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${activeCount} student(s) currently enrolled in this course.` },
      { status: 400 }
    )
  }

  await Course.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}