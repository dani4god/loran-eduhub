// app/api/admin/lesson-notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  await connectDB()
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending_approval'
  
  // Build query with type-safe status filtering
  const query: any = {}
  if (status !== 'all') {
    query.status = status
  }
  
  const notes = await LessonNote.find(query).sort({ updatedAt: -1 })
  
  const tutorIds = [...new Set(notes.map((n: any) => n.tutorId.toString()))]
  const tutors = await Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName email')
  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))
  
  return NextResponse.json({
    notes: notes.map((n: any) => ({
      _id: n._id.toString(),
      title: n.title,
      coverImageUrl: n.coverImageUrl,
      price: n.price,
      subject: n.subject,
      studentClass: n.studentClass,
      status: n.status,
      rejectionReason: n.rejectionReason || null,
      tutorName: tutorById.get(n.tutorId.toString()) 
        ? `${tutorById.get(n.tutorId.toString())!.firstName} ${tutorById.get(n.tutorId.toString())!.lastName}` 
        : 'Unknown',
      tutorEmail: tutorById.get(n.tutorId.toString())?.email || '',
      updatedAt: n.updatedAt,
    })),
  })
}