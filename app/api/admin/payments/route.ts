// app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Student from '@/models/Student'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')

  const query: any = {}
  if (status && status !== 'all') query.status = status

  const total = await Payment.countDocuments(query)
  const payments = await Payment.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)

  const studentIds = payments.map((p: any) => p.studentId)
  const students = await Student.find({ _id: { $in: studentIds } }).select('firstName lastName')
  const studentById = new Map(students.map((s: any) => [s._id.toString(), s]))

  const results = payments.map((p: any) => ({
    _id: p._id.toString(),
    studentName: studentById.get(p.studentId.toString())
      ? `${studentById.get(p.studentId.toString())!.firstName} ${studentById.get(p.studentId.toString())!.lastName}`
      : 'Unknown Student',
    tutors: [...new Set(p.courseDetails.map((d: any) => d.tutorName))],
    courses: p.courseDetails.map((d: any) => d.courseName),
    amount: p.amount,
    plan: p.plan,
    status: p.status,
    paystackReference: p.paystackReference,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  }))

  return NextResponse.json({ payments: results, total, page, pages: Math.ceil(total / limit) })
}