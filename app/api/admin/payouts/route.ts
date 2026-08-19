// app/api/admin/payouts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import PayoutLog from '@/models/PayoutLog'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import Course from '@/models/Course'
import { ensurePayoutLogs, ensureCoachingPayoutLogs } from '@/lib/payout'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  await ensurePayoutLogs()
  await ensureCoachingPayoutLogs()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'

  const query: any = status !== 'all' ? { status } : {}
  const logs = await PayoutLog.find(query).sort({ createdAt: -1 }).limit(200)

  const tutorIds = [...new Set(logs.map((l: any) => l.tutorId.toString()))]
  const studentIds = [...new Set(logs.map((l: any) => l.studentId.toString()))]
  const courseIds = [...new Set(logs.map((l: any) => l.courseId.toString()))]

  const [tutors, students, selfPacedStudents, courses] = await Promise.all([
    Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName bankDetails'),
    Student.find({ _id: { $in: studentIds } }).select('firstName lastName'),
    SelfPacedStudent.find({ _id: { $in: studentIds } }).select('firstName lastName'),
    Course.find({ _id: { $in: courseIds } }).select('name'),
  ])

  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))
  const studentById = new Map(students.map((s: any) => [s._id.toString(), s]))
  const selfPacedStudentById = new Map(selfPacedStudents.map((s: any) => [s._id.toString(), s]))
  const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))

  const results = logs.map((l: any) => {
    const tutor = tutorById.get(l.tutorId.toString())
    const student = studentById.get(l.studentId.toString())
    const selfPacedStudent = selfPacedStudentById.get(l.studentId.toString())
    const course = courseById.get(l.courseId.toString())

    // Determine student name based on source model
    let studentName = 'Unknown Student'
    if (l.sourceModel === 'CoachingBooking' && selfPacedStudent) {
      studentName = `${selfPacedStudent.firstName} ${selfPacedStudent.lastName}`
    } else if (student) {
      studentName = `${student.firstName} ${student.lastName}`
    }

    return {
      _id: l._id.toString(),
      tutorId: l.tutorId.toString(),
      tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown Tutor',
      bankName: tutor?.bankDetails?.bankName || null,
      accountNumber: tutor?.bankDetails?.accountNumber || null,
      accountName: tutor?.bankDetails?.accountName || null,
      hasBankDetails: !!tutor?.bankDetails?.paystackRecipientCode,
      studentName,
      courseName: course?.name || 'Unknown Course',
      grossAmount: l.grossAmount,
      commissionAmount: l.commissionAmount,
      netAmount: l.netAmount,
      status: l.status,
      failureReason: l.failureReason || null,
      paidAt: l.paidAt,
      createdAt: l.createdAt,
      sourceModel: l.sourceModel || 'Enrollment', // For debugging
    }
  })

  const [pendingCount, paidCount, failedCount] = await Promise.all([
    PayoutLog.countDocuments({ status: 'pending' }),
    PayoutLog.countDocuments({ status: 'paid' }),
    PayoutLog.countDocuments({ status: 'failed' }),
  ])

  return NextResponse.json({
    payouts: results,
    statusCounts: { pending: pendingCount, paid: paidCount, failed: failedCount },
  })
}