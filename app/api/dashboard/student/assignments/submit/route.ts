import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Assignment from '@/models/Assignment'
import AssignmentSubmission from '@/models/AssignmentSubmission'
import Enrollment from '@/models/Enrollment'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const { assignmentId } = await req.json()
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 })
    }

    const assignment = await Assignment.findById(assignmentId)
    if (!assignment || !assignment.isPublished) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Resolve the CURRENT active enrollment first — everything downstream
    // (duplicate check, the submission record itself) is scoped to it.
    const enrollment = await Enrollment.findOne({
      studentId: student._id,
      courseId: assignment.courseId,
      status: 'active' as const,
    })
    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Duplicate check now scoped to THIS enrollment — a submission tied to
    // a previous, withdrawn enrollment no longer blocks a fresh one.
    const existing = await AssignmentSubmission.findOne({
      assignmentId,
      enrollmentId: enrollment._id,
    })
    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment' },
        { status: 400 }
      )
    }

    const submission = await AssignmentSubmission.create({
      assignmentId,
      studentId: student._id,
      enrollmentId: enrollment._id,
      tutorId: assignment.tutorId,
      courseId: assignment.courseId,
      submittedAt: new Date(),
      status: 'submitted',
    })

    return NextResponse.json({ success: true, submission }, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment' },
        { status: 400 }
      )
    }
    console.error('Submit assignment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}