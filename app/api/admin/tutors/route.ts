// api/admin/tutors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import '@/models/Course'
import Tutor from '@/models/Tutor'
import Enrollment from '@/models/Enrollment'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query: any = {}
    if (status && status !== 'all') query.status = status
    if (search && search.trim()) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const total = await Tutor.countDocuments(query)
    const tutors = await Tutor.find(query)
      .populate('courses', 'name category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    // Distinct-student count per tutor (a student with 2 courses under the
    // same tutor counts once, not twice).
    const tutorIds = tutors.map((t: any) => t._id)
    const countAgg = await Enrollment.aggregate([
      { $match: { tutorId: { $in: tutorIds }, status: { $in: ['active', 'paused', 'expired'] } } },
      { $group: { _id: { tutorId: '$tutorId', studentId: '$studentId' } } },
      { $group: { _id: '$_id.tutorId', count: { $sum: 1 } } },
    ])
    const countMap = new Map(countAgg.map((c: any) => [c._id.toString(), c.count]))

    const tutorsWithCounts = tutors.map((t: any) => ({
      ...t.toObject(),
      studentCount: countMap.get(t._id.toString()) || 0,
    }))

    // Status tab counts (unaffected by current filter, so tab badges are stable)
    const [pendingCount, approvedCount, disapprovedCount, suspendedCount] = await Promise.all([
      Tutor.countDocuments({ status: 'pending' }),
      Tutor.countDocuments({ status: 'approved' }),
      Tutor.countDocuments({ status: 'disapproved' }),
      Tutor.countDocuments({ status: 'suspended' }),
    ])

    return NextResponse.json({
      tutors: tutorsWithCounts,
      total,
      page,
      pages: Math.ceil(total / limit),
      statusCounts: {
        pending: pendingCount,
        approved: approvedCount,
        disapproved: disapprovedCount,
        suspended: suspendedCount,
        all: pendingCount + approvedCount + disapprovedCount + suspendedCount,
      },
    })
  } catch (error: any) {
    console.error('Admin tutors error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}