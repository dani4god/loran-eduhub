// app/api/admin/payouts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import PayoutLog from '@/models/PayoutLog'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import Course from '@/models/Course'
import LessonNotePurchase from '@/models/LessonNotePurchase'
import { ensurePayoutLogs, ensureCoachingPayoutLogs, ensureLessonNotePayoutLogs } from '@/lib/payout'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  await ensurePayoutLogs()
  await ensureCoachingPayoutLogs()
  await ensureLessonNotePayoutLogs()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'

  const query: any = status !== 'all' ? { status } : {}
  const logs = await PayoutLog.find(query).sort({ createdAt: -1 }).limit(200)

  const tutorIds = [...new Set(logs.map((l: any) => l.tutorId.toString()))]
  const studentIds = [...new Set(logs.map((l: any) => l.studentId).filter(Boolean).map((id: any) => id.toString()))]
  const courseIds = [...new Set(logs.map((l: any) => l.courseId).filter(Boolean).map((id: any) => id.toString()))]
  const purchaseIds = [...new Set(logs.filter((l: any) => l.sourceModel === 'LessonNotePurchase').map((l: any) => l.purchaseId.toString()))]

  const [tutors, students, selfPacedStudents, courses, lessonNotePurchases] = await Promise.all([
    Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName bankDetails'),
    Student.find({ _id: { $in: studentIds } }).select('firstName lastName email'),
    SelfPacedStudent.find({ _id: { $in: studentIds } }).select('firstName lastName email'),
    Course.find({ _id: { $in: courseIds } }).select('name'),
    LessonNotePurchase.find({ _id: { $in: purchaseIds } }).select('buyerName buyerEmail'),
  ])

  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))
  const studentById = new Map(students.map((s: any) => [s._id.toString(), s]))
  const selfPacedStudentById = new Map(selfPacedStudents.map((s: any) => [s._id.toString(), s]))
  const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))
  const purchaseById = new Map(lessonNotePurchases.map((p: any) => [p._id.toString(), p]))

  const results = logs.map((l: any) => {
    const tutor = tutorById.get(l.tutorId.toString())
    const course = courseById.get(l.courseId?.toString())
    
    // Determine student name based on source model
    let studentName = 'Unknown Student'
    let studentEmail = null
    
    if (l.sourceModel === 'CoachingBooking') {
      const spStudent = selfPacedStudentById.get(l.studentId?.toString())
      if (spStudent) {
        studentName = `${spStudent.firstName} ${spStudent.lastName}`
        studentEmail = spStudent.email
      }
    } else if (l.sourceModel === 'LessonNotePurchase') {
      const purchase = purchaseById.get(l.purchaseId?.toString())
      if (purchase) {
        studentName = purchase.buyerName || 'Anonymous Buyer'
        studentEmail = purchase.buyerEmail || null
      }
    } else {
      const student = studentById.get(l.studentId?.toString())
      if (student) {
        studentName = `${student.firstName} ${student.lastName}`
        studentEmail = student.email
      }
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
      studentEmail,
      courseName: course?.name || 'Unknown Course',
      grossAmount: l.grossAmount,
      commissionAmount: l.commissionAmount,
      netAmount: l.netAmount,
      status: l.status,
      failureReason: l.failureReason || null,
      paidAt: l.paidAt,
      createdAt: l.createdAt,
      sourceModel: l.sourceModel || 'Enrollment',
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