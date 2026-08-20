// app/api/self-paced/courses/[id]/review-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedCourseReview from '@/models/SelfPacedCourseReview'
import { isCourseComplete } from '@/lib/selfPaced'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const enrollment = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId: id })
  if (!enrollment) return NextResponse.json({ error: 'You do not own this course' }, { status: 403 })

  const course = await SelfPacedCourse.findById(id)
  const existingReview = await SelfPacedCourseReview.findOne({ selfPacedStudentId: student._id, courseId: id })

  return NextResponse.json({
    isComplete: course ? isCourseComplete(course, enrollment) : false,
    hasReviewed: !!existingReview,
  })
}