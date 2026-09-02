import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'
import { canonicalExamPrepSubject } from '@/lib/examPrepCatalog'
import { hashExamPrepPin, issueExamPrepSession, setExamPrepSessionCookie, validateExamPrepPin } from '@/lib/examPrepAuth'

function makeRegNumber() {
  return `LEP-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, location, school, subjectsInterested = [], pin } = await req.json()

    if (!fullName?.trim() || !email?.trim() || !location?.trim() || !school?.trim()) {
      return NextResponse.json({ error: 'Full name, email, location and school are required.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!validateExamPrepPin(pin)) {
      return NextResponse.json({ error: 'Create a 6-digit PIN.' }, { status: 400 })
    }

    await connectDB()

    const normalizedEmail = String(email).trim().toLowerCase()
    if (await ExamPrepStudent.exists({ email: normalizedEmail })) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
    }

    let regNumber = makeRegNumber()
    while (await ExamPrepStudent.exists({ regNumber })) regNumber = makeRegNumber()

    const cleanSubjects: string[] = Array.from(new Set(
      (Array.isArray(subjectsInterested) ? subjectsInterested : [])
        .map((s: unknown) => canonicalExamPrepSubject(String(s)))
        .filter((subject): subject is string => typeof subject === 'string' && !!subject)
    ))

    const student = (await ExamPrepStudent.create({
      regNumber,
      fullName: fullName.trim(),
      email: normalizedEmail,
      location: location.trim(),
      school: school.trim(),
      subjectsInterested: cleanSubjects,
      authPinHash: await hashExamPrepPin(String(pin)),
      lastLoginAt: new Date(),
    })) as { _id: any; regNumber: string }

    const settings = await ExamPrepSettings.findOne({ key: 'global' })
    await ExamPrepSubscription.create({
      examPrepStudentId: student._id,
      wasFreeAtRegistration: !settings?.isPaid,
    })

    const session = await issueExamPrepSession(String(student._id), req.headers.get('user-agent'))
    const response = NextResponse.json({ success: true, regNumber: student.regNumber, requiresPayment: !!settings?.isPaid }, { status: 201 })
    setExamPrepSessionCookie(response, session.rawToken, session.expiresAt)
    return response
  } catch (error) {
    console.error('Exam Prep register:', error)
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })
  }
}
