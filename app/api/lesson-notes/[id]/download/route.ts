// app/api/lesson-notes/[id]/download/route.ts — the actual PDF
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import LessonNotePurchase from '@/models/LessonNotePurchase'
import Tutor from '@/models/Tutor'
import { renderLessonNotePdf } from '@/lib/lessonNotePdf'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')

  await connectDB()
  const note = await LessonNote.findById(id)
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (note.price > 0) {
    if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    const purchase = await LessonNotePurchase.findOne({ paystackReference: reference, lessonNoteId: id })
    if (!purchase) return NextResponse.json({ error: 'No matching purchase found' }, { status: 403 })
  }

  const tutor = await Tutor.findById(note.tutorId)
  const pdfBuffer = await renderLessonNotePdf({
    title: note.title, subject: note.subject, studentClass: note.studentClass,
    tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Loran EduHub',
    weeks: note.weeks,
  })

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${note.title.replace(/\s+/g, '-')}.pdf"` },
  })
}