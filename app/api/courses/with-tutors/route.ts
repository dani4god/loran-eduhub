// app/api/debug/courses-tutors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const courses = await Course.find({ isActive: true }).lean()
    const tutors = await Tutor.find({ status: 'approved' })
      .populate('courses')
      .lean()

    return NextResponse.json({
      coursesCount: courses.length,
      courses: courses.map(c => ({ id: c._id, name: c.name })),
      tutorsCount: tutors.length,
      tutors: tutors.map(t => ({
        id: t._id,
        name: `${t.firstName} ${t.lastName}`,
        courseIds: (t.courses || []).map((c: any) => c._id?.toString()),
        courseNames: (t.courses || []).map((c: any) => c.name),
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}