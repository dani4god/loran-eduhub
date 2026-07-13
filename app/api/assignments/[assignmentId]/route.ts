import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Assignment from '@/models/Assignment'

// PATCH — publish/unpublish or update
export async function PATCH(
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

    const body = await req.json()

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, tutorId: tutor._id },
      { $set: body },
      { new: true }
    )

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE
export async function DELETE(
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

    await Assignment.findOneAndDelete({ _id: assignmentId, tutorId: tutor._id })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}