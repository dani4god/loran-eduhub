// app/api/tutor/self-paced-courses/[id]/students/[enrollmentId]/unlock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  const { id, enrollmentId } = await params
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

  const enrollment = await SelfPacedEnrollment.findById(enrollmentId)
  if (!enrollment || enrollment.courseId.toString() !== id) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  if (enrollment.lockedAtWeek) {
    enrollment.weekProgress = enrollment.weekProgress.filter((w: any) => w.weekNumber !== enrollment.lockedAtWeek)
  }
  enrollment.locked = false
  enrollment.lockedAtWeek = undefined
  enrollment.unlockedByTutorAt = new Date()
  await enrollment.save()

  return NextResponse.json({ success: true })
}