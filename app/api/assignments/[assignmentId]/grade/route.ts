import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Assignment from '@/models/Assignment'
import AssignmentSubmission from '@/models/AssignmentSubmission'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const tutor = await Tutor.findOne({ userId: session.user.id })
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const { submissionId, score, feedback } = await req.json()

    if (!submissionId || score === undefined || score === null) {
      return NextResponse.json(
        { error: 'submissionId and score are required' },
        { status: 400 }
      )
    }

    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (Number(score) > assignment.totalScore) {
      return NextResponse.json(
        { error: `Score cannot exceed total score of ${assignment.totalScore}` },
        { status: 400 }
      )
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { _id: submissionId, tutorId: tutor._id },
      {
        $set: {
          score: Number(score),
          feedback: feedback ?? '',
          gradedAt: new Date(),
          status: 'graded',
        },
      },
      { new: true }
    )

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, submission })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}