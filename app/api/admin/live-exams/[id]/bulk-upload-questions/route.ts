// app/api/admin/live-exams/[id]/bulk-upload-questions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LiveExam from '@/models/LiveExam'
import { parseQuestionsWorkbook } from '@/lib/examBulkUpload'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const exam = await LiveExam.findById(id)
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mode = (formData.get('mode') as string) || 'append'
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { questions, errors } = parseQuestionsWorkbook(buffer)
  if (questions.length === 0) {
    return NextResponse.json({ error: 'No valid questions found', rowErrors: errors }, { status: 400 })
  }

  if (mode === 'replace') exam.questions = questions as any
  else exam.questions.push(...(questions as any))
  await exam.save()

  return NextResponse.json({ success: true, imported: questions.length, skipped: errors.length, rowErrors: errors, totalQuestionsNow: exam.questions.length })
}