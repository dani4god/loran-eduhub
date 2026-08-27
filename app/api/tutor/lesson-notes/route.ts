// app/api/tutor/lesson-notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import LessonNote from '@/models/LessonNote'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  const notes = await LessonNote.find({ tutorId: tutor._id }).select('title coverImageUrl price status subject studentClass purchaseCount weeks updatedAt').sort({ updatedAt: -1 })
  return NextResponse.json({
    notes: notes.map((n: any) => ({
      _id: n._id.toString(), title: n.title, coverImageUrl: n.coverImageUrl, price: n.price,
      status: n.status, subject: n.subject, studentClass: n.studentClass, purchaseCount: n.purchaseCount, weekCount: n.weeks.length,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, studentClass, category, subject } = await req.json()
  if (!title?.trim() || !studentClass || !subject) {
    return NextResponse.json({ error: 'Title, class, and subject are required' }, { status: 400 })
  }
  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  const note = await LessonNote.create({ tutorId: tutor._id, title: title.trim(), studentClass, category, subject, weeks: [], status: 'draft' })
  return NextResponse.json({ success: true, noteId: note._id.toString() })
}