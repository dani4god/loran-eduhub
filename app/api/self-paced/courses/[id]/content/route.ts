// app/api/self-paced/courses/[id]/content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import Tutor from '@/models/Tutor'
import { getUnlockedWeekNumber, isCourseComplete } from '@/lib/selfPaced'

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
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const tutor = await Tutor.findById(course.tutorId).select('firstName lastName')
  const unlockedWeek = getUnlockedWeekNumber(enrollment)

  const weeks = course.weeks.map((w: any) => {
    const locked = w.weekNumber > unlockedWeek
    const attempt = enrollment.weekProgress.find((wp: any) => wp.weekNumber === w.weekNumber)

    return {
      weekNumber: w.weekNumber,
      title: w.title,
      locked,
      content: locked ? null : w.content,
      links: locked ? [] : w.links,
      questionCount: w.exam.questions.length,
      passed: attempt?.passed || false,
      lastScore: attempt?.examPercentage ?? null,
      // Questions never sent with answers — same principle as the main
      // course library exams.
      questions: locked ? [] : w.exam.questions.map((q: any) => ({ _id: q._id, type: q.type, question: q.question, options: q.options })),
    }
  })

  return NextResponse.json({
    courseId: course._id.toString(),
    title: course.title,
    tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown Tutor',
    coachingEnabled: course.coachingEnabled,
    coachingHourlyRate: course.coachingHourlyRate,
    discordEnabled: course.discordEnabled,
    discordDescription: course.discordDescription,
    weeklyWorkshop: course.weeklyWorkshop,
    weeks,
    unlockedWeek,
    isComplete: isCourseComplete(course, enrollment),
  })
}