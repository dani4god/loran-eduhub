// app/api/self-paced/courses/[id]/review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedCourseReview from '@/models/SelfPacedCourseReview'
import { isCourseComplete } from '@/lib/selfPaced'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const enrollment = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId: id })
  if (!enrollment) return NextResponse.json({ error: 'You do not own this course' }, { status: 403 })

  const course = await SelfPacedCourse.findById(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  if (!isCourseComplete(course, enrollment)) {
    return NextResponse.json({ error: 'Complete every week before leaving a review' }, { status: 400 })
  }

  const existing = await SelfPacedCourseReview.findOne({ selfPacedStudentId: student._id, courseId: id })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this course' }, { status: 400 })
  }

  const requiredFields = [
    'rating', 'courseExperience', 'wouldRecommend', 'difficultyLevel', 'mostDifficultConcept',
    'weeklyStructureHelpful', 'tutorRating', 'hadOneOnOneSession', 'workshopRating', 'careerImpact',
  ]
  const missing = requiredFields.find((f) => body[f] === undefined || body[f] === '')
  if (missing) {
    return NextResponse.json({ error: `Please answer all questions (missing: ${missing})` }, { status: 400 })
  }

  const lastInitial = student.lastName ? `${student.lastName[0]}.` : ''

  await SelfPacedCourseReview.create({
    selfPacedStudentId: student._id,
    courseId: id,
    tutorId: course.tutorId,
    studentDisplayName: `${student.firstName} ${lastInitial}`.trim(),
    rating: body.rating,
    courseExperience: body.courseExperience,
    wouldRecommend: body.wouldRecommend,
    difficultyLevel: body.difficultyLevel,
    mostDifficultConcept: body.mostDifficultConcept,
    weeklyStructureHelpful: body.weeklyStructureHelpful,
    tutorRating: body.tutorRating,
    hadOneOnOneSession: body.hadOneOnOneSession,
    workshopRating: body.workshopRating,
    careerImpact: body.careerImpact,
    platformMessage: body.platformMessage || '',
  })

  return NextResponse.json({ success: true })
}