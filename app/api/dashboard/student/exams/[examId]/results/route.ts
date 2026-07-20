import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Exam from '@/models/Exam'
import Enrollment from '@/models/Enrollment'
import Grade from '@/models/Grade'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const exam = await Exam.findById(examId).select('courseId').lean() as any
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Find this student's CURRENT enrollment for the exam's course — the
    // grade lookup below is scoped to it, so if the student took this exam
    // under a previous (now withdrawn) enrollment and again after
    // re-enrolling, this only returns the result tied to their current
    // enrollment, not whichever grade Mongo happens to find first.
    const enrollment = await Enrollment.findOne({
      studentId: student._id,
      courseId: exam.courseId,
      status: { $in: ['active', 'paused', 'expired'] },
    }).sort({ createdAt: -1 })

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 })
    }

    const grade = await Grade.findOne({
      studentId: student._id,
      examId,
      enrollmentId: enrollment._id,
    }).lean()

    if (!grade) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 })
    }

    return NextResponse.json({ grade })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}