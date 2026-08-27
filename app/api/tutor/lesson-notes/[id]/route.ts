// app/api/tutor/lesson-notes/[id]/route.ts — GET/PATCH/DELETE, same lock-when-published rule as self-paced
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import LessonNote from '@/models/LessonNote'
import LessonNotePurchase from '@/models/LessonNotePurchase'

async function getOwned(id: string, userId: string) {
  const tutor = await Tutor.findOne({ userId })
  if (!tutor) return { error: 'Tutor not found', status: 404 as const }
  const note = await LessonNote.findById(id)
  if (!note) return { error: 'Not found', status: 404 as const }
  if (note.tutorId.toString() !== tutor._id.toString()) return { error: 'Forbidden', status: 403 as const }
  return { note }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const r = await getOwned(id, session.user.id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ note: r.note })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const r = await getOwned(id, session.user.id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status })
  if (r.note.status === 'published') {
    return NextResponse.json({ error: 'This lesson note is published and cannot be edited. Unpublish it first.' }, { status: 400 })
  }
  const body = await req.json()
  const allowed = ['title', 'description', 'coverImageUrl', 'previewVideoUrl', 'price', 'weeks']
  const update: any = {}
  for (const f of allowed) if (body[f] !== undefined) update[f] = body[f]
  const updated = await LessonNote.findByIdAndUpdate(id, update, { new: true })
  return NextResponse.json({ success: true, note: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const r = await getOwned(id, session.user.id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status })
  const purchases = await LessonNotePurchase.countDocuments({ lessonNoteId: id })
  if (purchases > 0) {
    return NextResponse.json({ error: `Cannot delete — ${purchases} purchase(s) exist. Unpublish instead.` }, { status: 400 })
  }
  await LessonNote.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}