//app/api/exam-prep/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireExamPrepStudent } from '@/lib/examPrepAuth'

export async function GET(req: NextRequest) {
  const auth = await requireExamPrepStudent(req)
  if (!auth.ok) return auth.response
  const s = auth.student
  return NextResponse.json({
    student: {
      _id: s._id.toString(),
      regNumber: s.regNumber,
      fullName: s.fullName,
      email: s.email,
      location: s.location,
      school: s.school,
      subjectsInterested: s.subjectsInterested,
    },
  })
}
