// app/api/tutor/courses/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'


export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id }).populate('courses', 'name category')

  return NextResponse.json({ courses: tutor?.courses || [] })
}

// app/api/tutor/courses/route.ts — keep the existing GET, add this PATCH

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseIds } = await req.json()
  if (!Array.isArray(courseIds)) {
    return NextResponse.json({ error: 'courseIds must be an array' }, { status: 400 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const validCourses = await Course.find({ _id: { $in: courseIds } }).select('_id')
  if (validCourses.length !== courseIds.length) {
    return NextResponse.json({ error: 'One or more selected courses are invalid' }, { status: 400 })
  }

  if (courseIds.length === 0) {
    return NextResponse.json({ error: 'You must teach at least one course' }, { status: 400 })
  }

  tutor.courses = courseIds
  await tutor.save()

  return NextResponse.json({ success: true, courses: courseIds })
}