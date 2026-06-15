import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const page = parseInt(searchParams.get('page') || '1')
    const random = searchParams.get('random') === 'true'
    const withCourses = searchParams.get('withCourses') === 'true'

    let selectFields = '-resume -userId'
    let populateField = withCourses
      ? { path: 'courses', select: 'name category description' }
      : { path: 'courses', select: 'name category' }

    if (random) {
      const tutors = await Tutor.aggregate([
        { $match: { status: 'approved' } },
        { $sample: { size: 6 } },
      ])
      // Populate courses manually after aggregate
      const populated = await Tutor.populate(tutors, { path: 'courses', select: 'name category' })
      return NextResponse.json({ tutors: populated })
    }

    const total = await Tutor.countDocuments({ status: 'approved' })
    const tutors = await Tutor.find({ status: 'approved' })
      .populate(populateField)
      .select(selectFields)
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({ tutors, total, page, pages: Math.ceil(total / limit) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}