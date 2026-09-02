//app/api/exam-prep/ai-tutor/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireExamPrepAccess } from '@/lib/examPrepAuth'
import { canonicalExamPrepSubject } from '@/lib/examPrepCatalog'
import { generateTopicTutorLesson } from '@/lib/examAI'

export async function POST(req: NextRequest) {
  try {
    const access = await requireExamPrepAccess(req)
    if (!access.ok) return access.response

    const { subject, topic, subtopic, performance } = await req.json()
    const canonical = canonicalExamPrepSubject(String(subject || ''))
    if (!canonical || !topic?.trim()) return NextResponse.json({ error: 'Subject and topic are required.' }, { status: 400 })

    const lesson = await generateTopicTutorLesson({ subject: canonical, topic: topic.trim(), subtopic, performance })
    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('AI Tutor:', error)
    return NextResponse.json({ error: 'AI Tutor is unavailable.' }, { status: 500 })
  }
}
