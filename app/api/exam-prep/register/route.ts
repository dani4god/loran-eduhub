// app/api/exam-prep/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import { generateRegNumber } from '@/lib/examPrep'

export async function POST(req: NextRequest) {
  const { fullName, location, school, subjectsInterested } = await req.json()
  if (!fullName?.trim() || !location?.trim() || !school?.trim()) {
    return NextResponse.json({ error: 'Name, location, and school are required' }, { status: 400 })
  }

  await connectDB()

  let regNumber = generateRegNumber()
  while (await ExamPrepStudent.findOne({ regNumber })) regNumber = generateRegNumber()

  const student = await ExamPrepStudent.create({
    regNumber, fullName: fullName.trim(), location: location.trim(), school: school.trim(),
    subjectsInterested: subjectsInterested || [],
  })

  const settings = await ExamPrepSettings.findOneAndUpdate({ key: 'global' }, {}, { upsert: true, returnDocument: 'after' })

  // Snapshot the CURRENT pricing state at registration — this is what
  // makes later admin changes not retroactively affect this student.
  await ExamPrepSubscription.create({
    examPrepStudentId: student._id,
    wasFreeAtRegistration: !settings.isPaid,
  })

  return NextResponse.json({ success: true, regNumber })
}