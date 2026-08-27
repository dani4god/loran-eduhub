// app/api/tutor/payments/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import PayoutLog from '@/models/PayoutLog'
import Student from '@/models/Student'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import Course from '@/models/Course'
import LessonNotePurchase from '@/models/LessonNotePurchase'
import { ensurePayoutLogs, ensureCoachingPayoutLogs, ensureLessonNotePayoutLogs } from '@/lib/payout'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  // Generate payout logs for all sources
  await ensurePayoutLogs()
  await ensureCoachingPayoutLogs()
  await ensureLessonNotePayoutLogs()

  const logs = await PayoutLog.find({ tutorId: tutor._id }).sort({ createdAt: -1 }).limit(100)

  const studentIds = [...new Set(logs.map((l: any) => l.studentId).filter(Boolean).map((id: any) => id.toString()))]
  const courseIds = [...new Set(logs.map((l: any) => l.courseId).filter(Boolean).map((id: any) => id.toString()))]
  const purchaseIds = [...new Set(logs.filter((l: any) => l.sourceModel === 'LessonNotePurchase').map((l: any) => l.purchaseId.toString()))]

  const [students, selfPacedStudents, courses, lessonNotePurchases] = await Promise.all([
    Student.find({ _id: { $in: studentIds } }).select('firstName lastName email'),
    SelfPacedStudent.find({ _id: { $in: studentIds } }).select('firstName lastName email'),
    Course.find({ _id: { $in: courseIds } }).select('name'),
    LessonNotePurchase.find({ _id: { $in: purchaseIds } }).select('buyerName buyerEmail'),
  ])

  const studentById = new Map(students.map((s: any) => [s._id.toString(), s]))
  const selfPacedStudentById = new Map(selfPacedStudents.map((s: any) => [s._id.toString(), s]))
  const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))
  const purchaseById = new Map(lessonNotePurchases.map((p: any) => [p._id.toString(), p]))

  const results = logs.map((l: any) => {
    // Determine student name based on source model
    let studentName = 'Unknown Student'
    let studentEmail = null
    
    const studentId = l.studentId?.toString()
    
    if (l.sourceModel === 'CoachingBooking' && studentId) {
      const spStudent = selfPacedStudentById.get(studentId)
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
    } else if (studentId) {
      const student = studentById.get(studentId)
      if (student) {
        studentName = `${student.firstName} ${student.lastName}`
        studentEmail = student.email
      }
    }

    return {
      _id: l._id.toString(),
      studentName,
      studentEmail,
      courseName: courseById.get(l.courseId?.toString())?.name || 'Unknown Course',
      grossAmount: l.grossAmount,
      commissionAmount: l.commissionAmount,
      netAmount: l.netAmount,
      status: l.status,
      paidAt: l.paidAt,
      createdAt: l.createdAt,
      sourceModel: l.sourceModel || 'Enrollment',
    }
  })

  const totalEarned = logs.filter((l: any) => l.status === 'paid').reduce((sum: number, l: any) => sum + l.netAmount, 0)
  const totalPending = logs.filter((l: any) => l.status === 'pending').reduce((sum: number, l: any) => sum + l.netAmount, 0)

  return NextResponse.json({ 
    payments: results, 
    totalEarned, 
    totalPending,
    totalCount: logs.length,
  })
}