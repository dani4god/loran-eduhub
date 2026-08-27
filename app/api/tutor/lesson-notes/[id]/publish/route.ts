// app/api/tutor/lesson-notes/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import LessonNote from '@/models/LessonNote'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  const note = await LessonNote.findById(id)
  if (!note || note.tutorId.toString() !== tutor?._id.toString()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status: desired } = await req.json().catch(() => ({}))

  if (desired === 'draft') {
    if (note.status !== 'published') return NextResponse.json({ error: 'Only a published note can be unpublished' }, { status: 400 })
    note.status = 'draft'
    await note.save()
    return NextResponse.json({ success: true, status: note.status })
  }

  if (desired === 'pending_approval') {
    if (!['draft', 'rejected'].includes(note.status)) return NextResponse.json({ error: 'Cannot submit from current status' }, { status: 400 })
    if (note.weeks.length === 0) return NextResponse.json({ error: 'Add at least one week' }, { status: 400 })
    if (!note.coverImageUrl) return NextResponse.json({ error: 'Upload a cover image' }, { status: 400 })
    if (!note.description?.trim()) return NextResponse.json({ error: 'Add a description' }, { status: 400 })
    note.status = 'pending_approval'
    note.rejectionReason = undefined
    await note.save()
    return NextResponse.json({ success: true, status: note.status })
  }

  return NextResponse.json({ error: 'Invalid transition' }, { status: 400 })
}