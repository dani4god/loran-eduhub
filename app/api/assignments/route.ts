import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Assignment from '@/models/Assignment'
import AssignmentSubmission from '@/models/AssignmentSubmission'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'

// GET — tutor gets all their assignments
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const tutor = await Tutor.findOne({ userId: session.user.id })
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const assignments = await Assignment.find({ tutorId: tutor._id })
      .populate({ path: 'courseId', select: 'name category' })
      .sort({ createdAt: -1 })
      .lean()

    // For each assignment, get submission count and pending gradings
    const enriched = await Promise.all(
      assignments.map(async (a: any) => {
        const submissions = await AssignmentSubmission.find({
          assignmentId: a._id,
        })
          .populate({ path: 'studentId', select: 'firstName lastName' })
          .lean()

        const totalEnrolled = await Enrollment.countDocuments({
          tutorId: tutor._id,
          courseId: a.courseId?._id,
          status: 'active' as const,
        })

        return {
          _id: a._id.toString(),
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          totalScore: a.totalScore,
          dueDate: a.dueDate ?? null,
          isPublished: a.isPublished,
          courseName: a.courseId?.name ?? '',
          courseCategory: a.courseId?.category ?? '',
          courseId: a.courseId?._id?.toString() ?? '',
          totalEnrolled,
          submissionCount: submissions.length,
          pendingGrading: submissions.filter((s: any) => s.status === 'submitted').length,
          submissions: submissions.map((s: any) => ({
            _id: s._id.toString(),
            studentName: s.studentId
              ? `${s.studentId.firstName} ${s.studentId.lastName}`
              : 'Unknown',
            studentId: s.studentId?._id?.toString() ?? '',
            submittedAt: s.submittedAt,
            status: s.status,
            score: s.score ?? null,
            feedback: s.feedback ?? '',
            gradedAt: s.gradedAt ?? null,
          })),
          createdAt: a.createdAt,
        }
      })
    )

    return NextResponse.json({ assignments: enriched })
  } catch (error: any) {
    console.error('Get assignments error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — tutor creates assignment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const tutor = await Tutor.findOne({ userId: session.user.id })
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const { title, description, instructions, totalScore, dueDate, courseId, isPublished } =
      await req.json()

    if (!title || !description || !totalScore || !courseId) {
      return NextResponse.json(
        { error: 'title, description, totalScore and courseId are required' },
        { status: 400 }
      )
    }

    const assignment = await Assignment.create({
      tutorId: tutor._id,
      courseId,
      title,
      description,
      instructions: instructions ?? '',
      totalScore: Number(totalScore),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isPublished: isPublished ?? false,
    })

    return NextResponse.json({ success: true, assignment }, { status: 201 })
  } catch (error: any) {
    console.error('Create assignment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}