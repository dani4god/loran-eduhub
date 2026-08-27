// app/api/exam-prep/forgot-reg/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'

export async function POST(req: NextRequest) {
  const { fullName } = await req.json()
  if (!fullName?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })

  await connectDB()
  // Case-insensitive partial match — surfaces close matches without
  // requiring exact spelling/casing.
  const matches = await ExamPrepStudent.find({
    fullName: { $regex: fullName.trim(), $options: 'i' },
  }).select('regNumber fullName school').limit(5)

  return NextResponse.json({
    matches: matches.map((m: any) => ({ regNumber: m.regNumber, fullName: m.fullName, school: m.school })),
  })
}