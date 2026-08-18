// app/api/tutor/coaching-bookings/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import CoachingBooking from '@/models/CoachingBooking'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import User from '@/models/User'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import TutorAvailabilitySlot from '@/models/TutorAvailabilitySlot'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const bookings = await CoachingBooking.find({ tutorId: tutor._id, status: 'confirmed' }).sort({ createdAt: -1 })

  const results = await Promise.all(
    bookings.map(async (b: any) => {
      const student = await SelfPacedStudent.findById(b.selfPacedStudentId)
      const user = student ? await User.findById(student.userId).select('email') : null
      const course = await SelfPacedCourse.findById(b.courseId).select('title')
      const slot = await TutorAvailabilitySlot.findById(b.slotId)

      return {
        _id: b._id.toString(),
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        studentPhone: student?.phone || '',
        studentEmail: user?.email || '',
        courseName: course?.title || 'Unknown course',
        date: slot?.date || null,
        startTime: slot?.startTime || '',
        endTime: slot?.endTime || '',
        amountPaid: b.amountPaid,
        tutorReplyMessage: b.tutorReplyMessage || null,
        tutorReplyLink: b.tutorReplyLink || null,
        repliedAt: b.repliedAt || null,
        createdAt: b.createdAt,
      }
    })
  )

  return NextResponse.json({ bookings: results })
}