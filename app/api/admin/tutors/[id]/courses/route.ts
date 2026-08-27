// app/api/admin/tutors/[id]/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseIds } = await req.json()
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return NextResponse.json({ error: 'A tutor must have at least one course' }, { status: 400 })
  }

  await connectDB()
  const valid = await Course.find({ _id: { $in: courseIds } }).select('_id')
  if (valid.length !== courseIds.length) {
    return NextResponse.json({ error: 'One or more selected courses are invalid' }, { status: 400 })
  }

  const tutor = await Tutor.findByIdAndUpdate(id, { courses: courseIds }, { new: true }).populate('courses', 'name category')
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  // No Discord role changes needed here — course category roles for
  // STUDENTS are driven by their Enrollment, not by what the tutor teaches.
  // Reassigning a tutor's courses doesn't retroactively change existing
  // enrollments, only what they can be newly booked for going forward.

  return NextResponse.json({ success: true, courses: tutor.courses })
}