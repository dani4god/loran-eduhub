// app/api/exam-prep/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const regNumber = searchParams.get('regNumber')
  await connectDB()
  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const attempts = await ExamPrepAttempt.find({ examPrepStudentId: student._id })
  const bySubject: Record<string, { total: number; count: number }> = {}
  for (const a of attempts as any[]) {
    if (!bySubject[a.subject]) bySubject[a.subject] = { total: 0, count: 0 }
    bySubject[a.subject].total += a.percentage
    bySubject[a.subject].count += 1
  }

  const subjectAverages = Object.entries(bySubject).map(([subject, d]) => ({ subject, average: Math.round(d.total / d.count) }))
  const overallAverage = attempts.length > 0 ? Math.round(attempts.reduce((s: number, a: any) => s + a.percentage, 0) / attempts.length) : 0

  return NextResponse.json({
    totalAttempts: attempts.length,
    overallAverage,
    subjectAverages,
    weakestSubjects: subjectAverages.sort((a, b) => a.average - b.average).slice(0, 3),
    // AI-based weakness detection placeholder — flagged for future work,
    // per your note.
  })
}