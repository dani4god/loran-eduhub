import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import Tutor from '@/models/Tutor'
import Exam from '@/models/Exam'
import Grade from '@/models/Grade'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // ── Active enrollments ──
    const enrollments = await Enrollment.find({
        studentId: student._id,
        status: { $in: ['active', 'paused', 'expired'] as const },
    })
    .populate({ path: 'courseId', select: 'name category description' })
    .populate({ path: 'tutorId', select: 'firstName lastName profileImage' })
    .sort({ createdAt: -1 })
    .lean()

    // ── Subscription summary ──
    const activeEnrollment = enrollments.find(
        e => e.status === 'active'
    )

    const subscriptionEndDate = activeEnrollment?.endDate ? new Date(activeEnrollment.endDate) : null
    const now = new Date()
    const secondsLeft = subscriptionEndDate
      ? Math.max(0, Math.floor((subscriptionEndDate.getTime() - now.getTime()) / 1000))
      : null
    const daysLeft = secondsLeft !== null ? Math.floor(secondsLeft / 86400) : null

    // ── Available exams ──
    const courseIds = enrollments.map(e => (e.courseId as any)?._id)

    const exams = await Exam.find({
      courseId: { $in: courseIds },
      isPublished: true,
      $or: [
        { scheduledDate: { $lte: now } },
        { scheduledDate: null },
        { scheduledDate: { $exists: false } },
      ],
    })
      .select('title courseId duration scheduledDate')
      .populate({ path: 'courseId', select: 'name' })
      .lean()

    // ── Grades / scores ──
    const grades = await Grade.find({ studentId: student._id })
      .select('examId score total gradedAt')
      .sort({ gradedAt: -1 })
      .limit(5)
      .lean()

    // ── Format enrollments ──
    const formattedEnrollments = enrollments.map((e: any) => ({
      _id: e._id.toString(),
      courseName: e.courseId?.name ?? 'Unknown Course',
      courseCategory: e.courseId?.category ?? '',
      tutorName: e.tutorId
        ? `${e.tutorId.firstName} ${e.tutorId.lastName}`
        : 'Unknown Tutor',
      tutorImage: e.tutorId?.profileImage ?? null,
      plan: e.plan,
      status: e.status,
      startDate: e.startDate,
      endDate: e.endDate,
    }))

    return NextResponse.json({
      student: {
        _id: student._id.toString(),
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        state: student.state,
        profileImage: student.profileImage ?? null,
        hasUsedFreeTrial: student.hasUsedFreeTrial,
      },
      subscription: {
        status: activeEnrollment?.status ?? 'none',
        plan: activeEnrollment?.plan ?? null,
        endDate: activeEnrollment?.endDate ?? null,
        daysLeft,
        secondsLeft,
      },
      enrollments: formattedEnrollments,
      exams: exams.map((ex: any) => ({
        _id: ex._id.toString(),
        title: ex.title,
        courseName: ex.courseId?.name ?? '',
        duration: ex.duration,
        scheduledDate: ex.scheduledDate ?? null,
      })),
      recentGrades: grades.map((g: any) => ({
        _id: g._id.toString(),
        score: g.score,
        total: g.total,
        percentage: g.total > 0 ? Math.round((g.score / g.total) * 100) : 0,
        gradedAt: g.gradedAt,
      })),
      stats: {
        totalCourses: enrollments.length,
        totalExams: exams.length,
        averageScore:
          grades.length > 0
            ? Math.round(
                grades.reduce(
                  (acc: number, g: any) =>
                    acc + (g.total > 0 ? (g.score / g.total) * 100 : 0),
                  0
                ) / grades.length
              )
            : null,
      },
    })
  } catch (error: any) {
    console.error('Student overview error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}