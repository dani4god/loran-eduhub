// app/api/admin/self-paced-courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending_approval'

  const query: any = status !== 'all' ? { status } : {}
  const courses = await SelfPacedCourse.find(query).sort({ updatedAt: -1 })

  const tutorIds = [...new Set(courses.map((c: any) => c.tutorId.toString()))]
  const tutors = await Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName email')
  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))

  return NextResponse.json({
    courses: courses.map((c: any) => ({
      _id: c._id.toString(),
      title: c.title,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      price: c.price,
      category: c.category,
      weekCount: c.weeks.length,
      totalQuestions: c.weeks.reduce((sum: number, w: any) => sum + w.exam.questions.length, 0),
      status: c.status,
      rejectionReason: c.rejectionReason || null,
      tutorName: tutorById.get(c.tutorId.toString())
        ? `${tutorById.get(c.tutorId.toString())!.firstName} ${tutorById.get(c.tutorId.toString())!.lastName}`
        : 'Unknown Tutor',
      tutorEmail: tutorById.get(c.tutorId.toString())?.email || '',
      updatedAt: c.updatedAt,
    })),
  })
}