// app/api/tutor/self-paced-courses/[id]/weeks/[weekIndex]/bulk-upload-questions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import { parseQuestionsWorkbook } from '@/lib/examBulkUpload'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; weekIndex: string }> }
) {
  const { id, weekIndex } = await params
  const idx = parseInt(weekIndex)

  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  const course = await SelfPacedCourse.findById(id)
  if (!course || course.tutorId.toString() !== tutor?._id.toString()) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }
  if (!course.weeks[idx]) {
    return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mode = (formData.get('mode') as string) || 'append' // 'append' | 'replace'

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { questions, errors } = parseQuestionsWorkbook(buffer)

  if (questions.length === 0) {
    return NextResponse.json({ error: 'No valid questions found in the file', rowErrors: errors }, { status: 400 })
  }

  if (mode === 'replace') {
    course.weeks[idx].exam.questions = questions as any
  } else {
    course.weeks[idx].exam.questions.push(...(questions as any))
  }

  await course.save()

  return NextResponse.json({
    success: true,
    imported: questions.length,
    skipped: errors.length,
    rowErrors: errors,
    totalQuestionsNow: course.weeks[idx].exam.questions.length,
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { buildSampleTemplateBuffer } = await import('@/lib/examBulkUpload')
  const buffer = buildSampleTemplateBuffer()

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="question-template.xlsx"',
    },
  })
}