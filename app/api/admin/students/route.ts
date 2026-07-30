// app/api/admin/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import User from '@/models/User'
import Enrollment from '@/models/Enrollment'
import { computeEnrollmentAverage } from '@/lib/certificateEligibility'

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
    const search = searchParams.get('search')

    let query: any = {}
    if (search && search.trim()) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    const total = await Student.countDocuments(query)
    const students = await Student.find(query)
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const now = new Date()

    const results = await Promise.all(
      students.map(async (student: any) => {
        const enrollments = await Enrollment.find({ studentId: student._id })
          .populate('courseId', 'name category')
          .populate('tutorId', 'firstName lastName')
          .sort({ createdAt: -1 })

        const enrollmentDetails = await Promise.all(
          enrollments.map(async (e: any) => {
            const { averageScore, hasAnyGrades } = await computeEnrollmentAverage(e._id.toString())
            const daysLeft = e.endDate ? Math.ceil((new Date(e.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

            return {
              enrollmentId: e._id.toString(),
              courseName: e.courseId?.name || 'Unknown Course',
              courseCategory: e.courseId?.category || '',
              tutorName: e.tutorId ? `${e.tutorId.firstName} ${e.tutorId.lastName}` : 'Unknown Tutor',
              plan: e.plan,
              status: e.status,
              amount: e.amount,
              startDate: e.startDate,
              endDate: e.endDate,
              daysLeft,
              isExpired: e.status === 'expired' || (daysLeft !== null && daysLeft <= 0),
              averageScore: hasAnyGrades ? averageScore : null,
            }
          })
        )

        return {
          _id: student._id.toString(),
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.userId?.email || '',
          phone: student.phone,
          state: student.state,
          discordUsername: student.discordUsername || null,
          discordId: student.discordId || null,
          hasUsedFreeTrial: student.hasUsedFreeTrial,
          createdAt: student.createdAt,
          enrollments: enrollmentDetails,
        }
      })
    )

    return NextResponse.json({
      students: results,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Admin students error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}