// app/api/admin/self-paced-courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import SelfPacedCourse from '@/models/SelfPacedCourse'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, rejectionReason } = await req.json()
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  await connectDB()
  const course = await SelfPacedCourse.findById(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  if (action === 'approve') {
    course.status = 'published'
    course.rejectionReason = undefined
  } else {
    if (!rejectionReason?.trim()) {
      return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 })
    }
    course.status = 'rejected'
    course.rejectionReason = rejectionReason.trim()
  }
  await course.save()

  return NextResponse.json({ success: true, status: course.status })
}