// app/api/admin/exam-prep/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const students = await ExamPrepStudent.find().sort({ createdAt: -1 }).limit(200)
  const subs = await ExamPrepSubscription.find({ examPrepStudentId: { $in: students.map((s: any) => s._id) } })
  const subById = new Map(subs.map((s: any) => [s.examPrepStudentId.toString(), s]))

  return NextResponse.json({
    students: students.map((s: any) => {
      const sub = subById.get(s._id.toString())
      return {
        _id: s._id.toString(), regNumber: s.regNumber, fullName: s.fullName, location: s.location,
        school: s.school, subjectsInterested: s.subjectsInterested,
        accessType: sub?.wasFreeAtRegistration ? 'Free (locked-in)' : sub?.planDuration || 'Not subscribed',
        createdAt: s.createdAt,
      }
    }),
  })
}