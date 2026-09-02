//app/api/exam-prep/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import { issueExamPrepSession, setExamPrepSessionCookie, validateExamPrepPin, verifyExamPrepPin } from '@/lib/examPrepAuth'

export async function POST(req: NextRequest) {
  try {
    const { regNumber, pin } = await req.json()
    if (!regNumber || !validateExamPrepPin(pin)) {
      return NextResponse.json({ error: 'Enter your registration number and 6-digit PIN.' }, { status: 400 })
    }

    await connectDB()
    const student = await ExamPrepStudent.findOne({ regNumber: String(regNumber).trim().toUpperCase() }).select('+authPinHash')

    if (!student || !(await verifyExamPrepPin(String(pin), student.authPinHash))) {
      return NextResponse.json({ error: 'Invalid registration number or PIN.' }, { status: 401 })
    }

    student.lastLoginAt = new Date()
    await student.save()

    const session = await issueExamPrepSession(student._id.toString(), req.headers.get('user-agent'))
    const response = NextResponse.json({ success: true })
    setExamPrepSessionCookie(response, session.rawToken, session.expiresAt)
    return response
  } catch (error) {
    console.error('Exam Prep login:', error)
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}
