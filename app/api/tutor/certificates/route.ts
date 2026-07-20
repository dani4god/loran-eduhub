// app/api/tutor/certificates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'
import Grade from '@/models/Grade'
import Certificate from '@/models/Certificate'
import { classifyScore, generateCertificateNumber} from '@/lib/certificate'
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

  const certificates = await Certificate.find({ tutorId: tutor._id }).sort({ createdAt: -1 })

  return NextResponse.json({
    certificates: certificates.map(c => ({
      _id: c._id.toString(),
      studentName: c.studentName,
      courseName: c.courseName,
      classification: c.classification,
      averageScore: c.averageScore,
      certificateNumber: c.certificateNumber,
      issuedAt: c.issuedAt,
    })),
  })
}

// app/api/tutor/certificates/route.ts — POST handler replaced

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  if (!tutor.certificateSignatureUrl || !tutor.certificateLogoUrl) {
    return NextResponse.json(
      { error: 'Please set your signature and certificate logo in Certificate Settings first' },
      { status: 400 }
    )
  }

  const { enrollmentId } = await req.json()
  if (!enrollmentId) {
    return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 })
  }

  const enrollment = await Enrollment.findById(enrollmentId)
  if (!enrollment || enrollment.tutorId.toString() !== tutor._id.toString()) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  if (enrollment.status === 'withdrawn') {
    return NextResponse.json(
      { error: 'Cannot issue a certificate for a withdrawn enrollment' },
      { status: 400 }
    )
  }

  const existing = await Certificate.findOne({ enrollmentId })
  if (existing) {
    return NextResponse.json({ error: 'A certificate has already been issued for this enrollment' }, { status: 400 })
  }

  const [student, course, { averageScore, hasAnyGrades }] = await Promise.all([
    Student.findById(enrollment.studentId).select('firstName lastName'),
    Course.findById(enrollment.courseId).select('name'),
    computeEnrollmentAverage(enrollmentId),
  ])

  if (!student || !course) {
    return NextResponse.json({ error: 'Student or course not found' }, { status: 404 })
  }

  if (!hasAnyGrades) {
    return NextResponse.json(
      { error: 'This student has no graded exams or assignments for this enrollment yet' },
      { status: 400 }
    )
  }

  const classification = classifyScore(averageScore)

  if (classification === 'fail') {
    return NextResponse.json(
      { error: `Cannot issue a certificate — average score (${averageScore.toFixed(1)}%) is below the minimum pass mark of 45%` },
      { status: 400 }
    )
  }

  const certificate = await Certificate.create({
    studentId: enrollment.studentId,
    tutorId: tutor._id,
    courseId: enrollment.courseId,
    enrollmentId: enrollment._id,
    certificateNumber: generateCertificateNumber(),
    studentName: `${student.firstName} ${student.lastName}`,
    courseName: course.name,
    tutorName: `${tutor.firstName} ${tutor.lastName}`,
    signatureUrl: tutor.certificateSignatureUrl,
    logoUrl: tutor.certificateLogoUrl,
    averageScore,
    classification,
    durationStart: enrollment.startDate,
    durationEnd: enrollment.endDate || new Date(),
  })

  return NextResponse.json({ success: true, certificateId: certificate._id.toString() })
}