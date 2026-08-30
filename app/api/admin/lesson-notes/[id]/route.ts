// app/api/admin/lesson-notes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import Tutor from '@/models/Tutor'
import { sendLessonNoteApprovedEmail, sendLessonNoteRejectedEmail } from '@/lib/email'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const note = await LessonNote.findById(id).lean() as any
  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const tutor = await Tutor.findById(note.tutorId)
    .select('firstName lastName email')
    .lean() as any

  return NextResponse.json({
    note: {
      _id: note._id.toString(),
      title: note.title ?? '',
      description: note.description ?? '',
      content: note.content ?? '',
      pages: note.pages ?? [],
      coverImageUrl: note.coverImageUrl ?? null,
      price: note.price ?? 0,
      subject: note.subject ?? '',
      studentClass: note.studentClass ?? '',
      status: note.status,
      rejectionReason: note.rejectionReason ?? null,
      tutorName: tutor
        ? `${tutor.firstName} ${tutor.lastName}`
        : 'Unknown',
      tutorEmail: tutor?.email ?? '',
      purchaseCount: note.purchaseCount ?? 0,
      purchases: [], // no separate Purchase collection — count is on the note
      updatedAt: note.updatedAt,
      createdAt: note.createdAt,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, rejectionReason } = await req.json()

  await connectDB()

  const note = await LessonNote.findById(id)
  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const tutor = await Tutor.findById(note.tutorId)
    .select('firstName lastName email')
    .lean() as any

  if (action === 'approve') {
    note.status = 'published'
    note.rejectionReason = undefined
    await note.save()

    if (tutor) {
      await sendLessonNoteApprovedEmail(
        tutor.email,
        tutor.firstName,
        note.title,
        `${process.env.NEXTAUTH_URL}/lesson-notes/${note._id}`
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, status: note.status })
  }

  if (action === 'reject') {
    if (!rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason required' },
        { status: 400 }
      )
    }

    note.status = 'rejected'
    note.rejectionReason = rejectionReason.trim()
    await note.save()

    if (tutor) {
      await sendLessonNoteRejectedEmail(
        tutor.email,
        tutor.firstName,
        note.title,
        rejectionReason.trim()
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, status: note.status })
  }

  if (action === 'unpublish') {
    note.status = 'draft'
    await note.save()
    return NextResponse.json({ success: true, status: note.status })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}