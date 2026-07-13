import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Course from '@/models/Course'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const tutor = await Tutor.findOne({ userId: session.user.id }).select('courses')
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const courses = await Course.find({
      _id: { $in: tutor.courses },
      isActive: true,
    })
      .select('name category')
      .lean()

    return NextResponse.json({
      courses: courses.map((c: any) => ({
        _id: c._id.toString(),
        name: c.name,
        category: c.category,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}