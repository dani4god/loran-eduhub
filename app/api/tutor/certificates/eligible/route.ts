// app/api/tutor/certificates/eligible/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'
import Certificate from '@/models/Certificate'
import { classifyScore } from '@/lib/certificate'
import { computeEnrollmentAverage } from '@/lib/certificateEligibility'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  // Withdrawn enrollments are NEVER certificate-eligible, regardless of
  // grades — withdrawing means the student left before completing the
  // course. Only enrollments that ran their course (or are still running)
  // are considered.
  const enrollments = await Enrollment.find({
    tutorId: tutor._id,
    status: { $in: ['active', 'paused', 'expired'] },
  })

  const results = []

  for (const enrollment of enrollments) {
    const existingCert = await Certificate.findOne({ enrollmentId: enrollment._id })

    const [student, course, { averageScore, hasAnyGrades }] = await Promise.all([
      Student.findById(enrollment.studentId).select('firstName lastName'),
      Course.findById(enrollment.courseId).select('name'),
      computeEnrollmentAverage(enrollment._id.toString()),
    ])

    if (!student || !course) continue

    results.push({
      enrollmentId: enrollment._id.toString(),
      studentId: student._id.toString(),
      studentName: `${student.firstName} ${student.lastName}`,
      courseId: course._id.toString(),
      courseName: course.name,
      averageScore,
      classification: classifyScore(averageScore),
      hasGrades: hasAnyGrades,
      hasCertificate: !!existingCert,
      certificateId: existingCert?._id?.toString() || null,
    })
  }

  return NextResponse.json({ students: results })
}