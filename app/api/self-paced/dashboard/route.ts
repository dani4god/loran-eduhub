// app/api/self-paced/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import { getUnlockedWeekNumber, isCourseComplete, computeAverageScore, buildTodoList } from '@/lib/selfPaced'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const enrollments = await SelfPacedEnrollment.find({ selfPacedStudentId: student._id })

  const courses = await Promise.all(
    enrollments.map(async (e: any) => {
      const course = await SelfPacedCourse.findById(e.courseId).select('title coverImageUrl weeks')
      if (!course) return null

      return {
        enrollmentId: e._id.toString(),
        courseId: course._id.toString(),
        title: course.title,
        coverImageUrl: course.coverImageUrl,
        totalWeeks: course.weeks.length,
        unlockedWeek: getUnlockedWeekNumber(e),
        completedWeeks: e.weekProgress.filter((w: any) => w.passed).length,
        isComplete: isCourseComplete(course, e),
        averageScore: computeAverageScore(e),
        todos: buildTodoList(course, e),
        hasCertificate: !!e.certificateId,
      }
    })
  )

  return NextResponse.json({
    student: { firstName: student.firstName, lastName: student.lastName, profileImage: student.profileImage },
    courses: courses.filter(Boolean),
  })
}