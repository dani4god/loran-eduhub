// app/api/lesson-notes/route.ts — public browse with filters
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const studentClass = searchParams.get('class')
  const category = searchParams.get('category')
  const subject = searchParams.get('subject')

  const query: any = { status: 'published' }
  if (studentClass) query.studentClass = studentClass
  if (category) query.category = category
  if (subject) query.subject = subject

  const notes = await LessonNote.find(query).select('title description coverImageUrl price studentClass category subject tutorId weeks purchaseCount').sort({ createdAt: -1 })
  const tutorIds = [...new Set(notes.map((n: any) => n.tutorId.toString()))]
  const tutors = await Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName')
  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))

  return NextResponse.json({
    notes: notes.map((n: any) => ({
      _id: n._id.toString(), title: n.title, description: n.description, coverImageUrl: n.coverImageUrl,
      price: n.price, isFree: n.price === 0, studentClass: n.studentClass, category: n.category, subject: n.subject,
      weekCount: n.weeks.length, purchaseCount: n.purchaseCount,
      tutorName: tutorById.get(n.tutorId.toString()) ? `${tutorById.get(n.tutorId.toString())!.firstName} ${tutorById.get(n.tutorId.toString())!.lastName}` : 'Unknown',
    })),
  })
}