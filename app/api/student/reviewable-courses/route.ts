// app/api/student/reviewable-courses/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Review from '@/models/Review'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Excludes 'pending' — a student who hasn't actually paid/started yet
  // shouldn't be able to leave a review.
  const enrollments = await Enrollment.find({
    studentId: student._id,
    status: { $ne: 'pending' },
  })
    .populate('tutorId', 'firstName lastName')
    .populate('courseId', 'name')
    .sort({ createdAt: -1 })

  const seen = new Set<string>()
  const combos: any[] = []
  for (const e of enrollments as any[]) {
    if (!e.tutorId || !e.courseId) continue
    const key = `${e.tutorId._id}:${e.courseId._id}`
    if (seen.has(key)) continue
    seen.add(key)
    combos.push({
      tutorId: e.tutorId._id.toString(),
      tutorName: `${e.tutorId.firstName} ${e.tutorId.lastName}`,
      courseId: e.courseId._id.toString(),
      courseName: e.courseId.name,
    })
  }

  const reviews = await Review.find({ studentId: student._id })
  const reviewByKey = new Map(
    reviews.map((r: any) => [
      `${r.tutorId}:${r.courseId}`,
      { rating: r.rating, comment: r.comment, updatedAt: r.updatedAt },
    ])
  )

  const result = combos.map((c) => ({
    ...c,
    existingReview: reviewByKey.get(`${c.tutorId}:${c.courseId}`) || null,
  }))

  return NextResponse.json({ courses: result })
}