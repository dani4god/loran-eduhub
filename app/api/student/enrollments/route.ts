// app/api/student/enrollments/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'

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

  const enrollments = await Enrollment.find({
    studentId: student._id,
    status: { $in: ['active', 'paused'] },
  })
    .populate('courseId', 'name category')
    .populate('tutorId', 'firstName lastName')
    .sort({ endDate: 1 })

  const mapped = enrollments.map((e: any) => {
    const daysLeft = e.endDate ? Math.ceil((e.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

    return {
      enrollmentId: e._id.toString(),
      courseId: e.courseId?._id?.toString(),
      courseName: e.courseId?.name || 'Unknown Course',
      tutorId: e.tutorId?._id?.toString(),
      tutorName: e.tutorId ? `${e.tutorId.firstName} ${e.tutorId.lastName}` : 'Unknown Tutor',
      plan: e.plan,
      status: e.status,
      startDate: e.startDate,
      endDate: e.endDate,
      amount: e.amount,
      daysLeft,
    }
  })

  return NextResponse.json({ enrollments: mapped })
}