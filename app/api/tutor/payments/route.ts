// app/api/tutor/payments/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import PayoutLog from '@/models/PayoutLog'
import Student from '@/models/Student'
import Course from '@/models/Course'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const logs = await PayoutLog.find({ tutorId: tutor._id }).sort({ createdAt: -1 }).limit(100)

  const studentIds = [...new Set(logs.map((l: any) => l.studentId.toString()))]
  const courseIds = [...new Set(logs.map((l: any) => l.courseId.toString()))]
  const [students, courses] = await Promise.all([
    Student.find({ _id: { $in: studentIds } }).select('firstName lastName'),
    Course.find({ _id: { $in: courseIds } }).select('name'),
  ])
  const studentById = new Map(students.map((s: any) => [s._id.toString(), s]))
  const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))

  const results = logs.map((l: any) => ({
    _id: l._id.toString(),
    studentName: studentById.get(l.studentId.toString())
      ? `${studentById.get(l.studentId.toString())!.firstName} ${studentById.get(l.studentId.toString())!.lastName}`
      : 'Unknown Student',
    courseName: courseById.get(l.courseId.toString())?.name || 'Unknown Course',
    grossAmount: l.grossAmount,
    commissionAmount: l.commissionAmount,
    netAmount: l.netAmount,
    status: l.status,
    paidAt: l.paidAt,
    createdAt: l.createdAt,
  }))

  const totalEarned = logs.filter((l: any) => l.status === 'paid').reduce((sum: number, l: any) => sum + l.netAmount, 0)
  const totalPending = logs.filter((l: any) => l.status === 'pending').reduce((sum: number, l: any) => sum + l.netAmount, 0)

  return NextResponse.json({ payments: results, totalEarned, totalPending })
}