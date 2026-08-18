// app/api/tutor/self-paced-courses/[id]/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import { getUnlockedWeekNumber, computeAverageScore } from '@/lib/selfPaced'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  const course = await SelfPacedCourse.findById(id)
  if (!course || course.tutorId.toString() !== tutor?._id.toString()) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const enrollments = await SelfPacedEnrollment.find({ courseId: id }).sort({ createdAt: -1 })

  const results = await Promise.all(
    enrollments.map(async (e: any) => {
      const student = await SelfPacedStudent.findById(e.selfPacedStudentId).select('firstName lastName phone')
      return {
        enrollmentId: e._id.toString(),
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        studentPhone: student?.phone || '',
        unlockedWeek: getUnlockedWeekNumber(e),
        weeksPassed: e.weekProgress.filter((w: any) => w.passed).length,
        averageScore: computeAverageScore(e),
        locked: e.locked,
        lockedAtWeek: e.lockedAtWeek || null,
        amountPaid: e.amountPaid,
      }
    })
  )

  return NextResponse.json({ students: results })
}