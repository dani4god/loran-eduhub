// app/api/student/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Review from '@/models/Review'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tutorId, courseId, rating, comment } = await req.json()

  if (!tutorId || !courseId || !rating) {
    return NextResponse.json({ error: 'tutorId, courseId, and rating are required' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  await connectDB()

  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const enrollment = await Enrollment.findOne({
    studentId: student._id,
    tutorId,
    courseId,
    status: { $ne: 'pending' },
  })
  if (!enrollment) {
    return NextResponse.json(
      { error: 'You can only review a tutor for a course you have enrolled in' },
      { status: 403 }
    )
  }

  const lastInitial = student.lastName ? `${student.lastName[0]}.` : ''
  const studentDisplayName = `${student.firstName} ${lastInitial}`.trim()

  const review = await Review.findOneAndUpdate(
    { studentId: student._id, tutorId, courseId },
    {
      rating,
      comment: (comment || '').trim().slice(0, 1000),
      studentDisplayName,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return NextResponse.json({ success: true, review: { rating: review.rating, comment: review.comment } })
}