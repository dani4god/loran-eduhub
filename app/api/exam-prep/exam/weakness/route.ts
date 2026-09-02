//app/api/exam-prep/exam/weakness/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import ExamPrepSession from '@/models/ExamPrepSession'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'
import { requireExamPrepAccess } from '@/lib/examPrepAuth'
import { canonicalExamPrepSubject, isValidExamPrepClass } from '@/lib/examPrepCatalog'
import { getAIQuestions } from '@/lib/examAI'

export async function POST(req: NextRequest) {
  try {
    const access = await requireExamPrepAccess(req)
    if (!access.ok) return access.response

    const { subject, topic, count = 15, durationMinutes = 20, studentClass = 'ss3' } = await req.json()
    const canonical = canonicalExamPrepSubject(String(subject || ''))

    if (!canonical || !topic?.trim() || !isValidExamPrepClass(studentClass)) {
      return NextResponse.json({ error: 'Invalid weakness practice configuration.' }, { status: 400 })
    }

    await connectDB()
    const recent = await ExamPrepAttempt.find({ examPrepStudentId: access.student._id, subject: canonical })
      .sort({ createdAt: -1 }).limit(10).select('breakdown.fingerprint').lean()

    const exclude = Array.from(new Set(
      recent.flatMap((a: any) => (a.breakdown || []).map((b: any) => b.fingerprint).filter(Boolean))
    ))

    const questions = await getAIQuestions({
      subject: canonical,
      topic: topic.trim(),
      standard: 'mixed',
      studentClass,
      count: Math.min(30, Math.max(5, Number(count))),
      excludeFingerprints: exclude,
    })

    const duration = Math.min(60, Math.max(10, Number(durationMinutes)))
    const sessionToken = crypto.randomBytes(24).toString('hex')

    await ExamPrepSession.create({
      sessionToken,
      examPrepStudentId: access.student._id,
      examType: 'mixed',
      subject: canonical,
      studentClass,
      questions,
      durationMinutes: duration,
      expiresAt: new Date(Date.now() + (duration + 15) * 60 * 1000),
    })

    return NextResponse.json({
      sessionToken,
      durationMinutes: duration,
      questions: questions.map((q) => ({ id: q.id, text: q.text, options: q.options, topic: q.topic })),
    })
  } catch (error) {
    console.error('Weakness drill:', error)
    return NextResponse.json({ error: 'Could not prepare weakness drill.' }, { status: 500 })
  }
}
