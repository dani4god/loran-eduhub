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
  
  // Extended action list to include 'unpublish'
  if (!['approve', 'reject', 'unpublish'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  await connectDB()
  const course = await SelfPacedCourse.findById(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Handle unpublish action
  if (action === 'unpublish') {
    if (course.status !== 'published') {
      return NextResponse.json({ 
        error: 'Only a published course can be unpublished' 
      }, { status: 400 })
    }
    course.status = 'draft'
    course.rejectionReason = undefined
    await course.save()
    return NextResponse.json({ success: true, status: course.status })
  }

  // Handle approve action
  if (action === 'approve') {
    course.status = 'published'
    course.rejectionReason = undefined
  } 
  // Handle reject action
  else {
    if (!rejectionReason?.trim()) {
      return NextResponse.json({ 
        error: 'A rejection reason is required' 
      }, { status: 400 })
    }
    course.status = 'rejected'
    course.rejectionReason = rejectionReason.trim()
  }
  
  await course.save()

  return NextResponse.json({ success: true, status: course.status })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const course = await SelfPacedCourse.findById(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Full content, INCLUDING correct answers — this is for admin review
  // only, never exposed to students via the public/content routes.
  return NextResponse.json({ course })
}