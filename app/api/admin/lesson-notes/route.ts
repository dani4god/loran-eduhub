import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending_approval'

  const query: any = {}
  if (status !== 'all') {
    query.status = status
  }

  const notes = await LessonNote.find(query).sort({ updatedAt: -1 }).lean()

  const tutorIds = [...new Set(notes.map((n: any) => n.tutorId?.toString()).filter(Boolean))]
  const tutors = await Tutor.find({ _id: { $in: tutorIds } })
    .select('firstName lastName email')
    .lean()
  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))

  return NextResponse.json({
    notes: notes.map((n: any) => {
      const tutor = tutorById.get(n.tutorId?.toString())
      return {
        _id: n._id.toString(),
        title: n.title ?? '',
        description: n.description ?? '',
        content: n.content ?? '',
        pages: n.pages ?? [],
        coverImageUrl: n.coverImageUrl ?? null,
        price: n.price ?? 0,
        subject: n.subject ?? '',
        studentClass: n.studentClass ?? '',
        status: n.status,
        rejectionReason: n.rejectionReason ?? null,
        tutorName: tutor
          ? `${tutor.firstName} ${tutor.lastName}`
          : 'Unknown',
        tutorEmail: tutor?.email ?? '',
        purchaseCount: n.purchaseCount ?? 0,
        updatedAt: n.updatedAt,
      }
    }),
  })
}