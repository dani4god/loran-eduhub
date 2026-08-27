// app/api/lesson-notes/[id]/public/route.ts — detail page: desc, preview video, weeks 1–2 free preview
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()
  const note = await LessonNote.findById(id)
  if (!note || note.status !== 'published') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const tutor = await Tutor.findById(note.tutorId).select('firstName lastName profileImage bio')

  return NextResponse.json({
    _id: note._id.toString(), title: note.title, description: note.description, coverImageUrl: note.coverImageUrl,
    previewVideoUrl: note.previewVideoUrl, price: note.price, isFree: note.price === 0,
    studentClass: note.studentClass, category: note.category, subject: note.subject, purchaseCount: note.purchaseCount,
    tutor: tutor ? { firstName: tutor.firstName, lastName: tutor.lastName, profileImage: tutor.profileImage, bio: tutor.bio } : null,
    // Weeks 1–2 shown IN FULL as a free sample; everything beyond is locked
    // behind purchase — titles only, so the buyer knows what's coming.
    previewWeeks: note.weeks.filter((w: any) => w.weekNumber <= 2),
    lockedWeekTitles: note.weeks.filter((w: any) => w.weekNumber > 2).map((w: any) => ({ weekNumber: w.weekNumber, title: w.title })),
    totalWeeks: note.weeks.length,
  })
}