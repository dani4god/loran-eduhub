// app/api/student/announcements/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Announcement from '@/models/Announcement'
import AnnouncementAck from '@/models/AnnouncementAck'

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

  // Announcements are only visible for courses the student is CURRENTLY
  // actively enrolled in with that tutor — consistent with how course
  // library/exams/assignments are gated elsewhere.
  const enrollments = await Enrollment.find({
    studentId: student._id,
    status: 'active',
  }).select('tutorId courseId')

  if (enrollments.length === 0) {
    return NextResponse.json({ announcements: [] })
  }

  const announcements = await Announcement.find({
    $or: enrollments.map((e: any) => ({ tutorId: e.tutorId, courseId: e.courseId })),
  })
    .populate('tutorId', 'firstName lastName')
    .populate('courseId', 'name')
    .sort({ createdAt: -1 })
    .limit(100)

  const acks = await AnnouncementAck.find({
    studentId: student._id,
    announcementId: { $in: announcements.map((a: any) => a._id) },
  })
  const ackedIds = new Set(acks.map((a: any) => a.announcementId.toString()))

  return NextResponse.json({
    announcements: announcements.map((a: any) => ({
      _id: a._id.toString(),
      title: a.title,
      message: a.message,
      links: a.links,
      scheduledAt: a.scheduledAt || null,
      courseName: a.courseId?.name || 'Unknown Course',
      tutorName: a.tutorId ? `${a.tutorId.firstName} ${a.tutorId.lastName}` : 'Unknown Tutor',
      createdAt: a.createdAt,
      acknowledged: ackedIds.has(a._id.toString()),
    })),
  })
}