// app/api/tutor/self-paced-courses/[id]/publish/route.ts — full file
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'

export async function POST(
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
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const course = await SelfPacedCourse.findById(id)
  if (!course || course.tutorId.toString() !== tutor._id.toString()) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const desired = body.status

  if (desired === 'draft') {
    // Unpublish — allowed from 'published' only. Now editable again.
    if (course.status !== 'published') {
      return NextResponse.json({ error: 'Only a published course can be unpublished' }, { status: 400 })
    }
    course.status = 'draft'
    await course.save()
    return NextResponse.json({ success: true, status: course.status })
  }

  if (desired === 'pending_approval') {
    // Submit (or resubmit) for review — allowed from 'draft' or 'rejected'.
    if (!['draft', 'rejected'].includes(course.status)) {
      return NextResponse.json({ error: 'This course cannot be submitted for review from its current status' }, { status: 400 })
    }

    if (course.weeks.length === 0) {
      return NextResponse.json({ error: 'Add at least one week before submitting' }, { status: 400 })
    }
    if (!course.coverImageUrl) {
      return NextResponse.json({ error: 'Upload a cover image before submitting' }, { status: 400 })
    }
    const weekWithoutQuestions = course.weeks.find((w: any) => w.exam.questions.length === 0)
    if (weekWithoutQuestions) {
      return NextResponse.json(
        { error: `Week ${weekWithoutQuestions.weekNumber} has no exam questions — every week needs at least one` },
        { status: 400 }
      )
    }

    course.status = 'pending_approval'
    course.rejectionReason = undefined
    await course.save()
    return NextResponse.json({ success: true, status: course.status })
  }

  return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
}