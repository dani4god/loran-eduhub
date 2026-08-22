// app/api/self-paced/courses/[id]/certificate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedCertificate from '@/models/SelfPacedCertificate'
import SelfPacedCourseReview from '@/models/SelfPacedCourseReview'
import { isCourseComplete, computeAverageScore, classifyScore } from '@/lib/selfPaced'
import { generateCertificateNumber } from '@/lib/certificate'
import { renderSelfPacedCertificatePdf } from '@/lib/selfPacedCertificatePdf'
import { getSiteSettings } from '@/lib/siteSettings'

const SIGNATORY_NAME = 'Okeke Daniel'
const SIGNATORY_TITLE = 'Academic Director'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const enrollment = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId: id })
  if (!enrollment) return NextResponse.json({ error: 'You do not own this course' }, { status: 403 })

  const course = await SelfPacedCourse.findById(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  if (!isCourseComplete(course, enrollment)) {
    return NextResponse.json({ error: 'Complete every week to unlock your certificate' }, { status: 400 })
  }

  const hasReviewed = await SelfPacedCourseReview.findOne({ selfPacedStudentId: student._id, courseId: id })
  if (!hasReviewed) {
    return NextResponse.json({ error: 'Please leave a course review before downloading your certificate', reviewRequired: true }, { status: 400 })
  }

  let certificate = enrollment.certificateId
    ? await SelfPacedCertificate.findById(enrollment.certificateId)
    : null

  if (!certificate) {
    const settings = await getSiteSettings()
    if (!settings.certificateSignatureUrl || !settings.certificateLogoUrl) {
      return NextResponse.json({ error: 'Certificate signature/logo has not been set up yet — please contact support' }, { status: 400 })
    }

    const averageScore = computeAverageScore(enrollment) // used only to classify, never displayed

    certificate = await SelfPacedCertificate.create({
      selfPacedStudentId: student._id,
      courseId: course._id,
      tutorId: course.tutorId,
      enrollmentId: enrollment._id,
      certificateNumber: generateCertificateNumber(),
      studentName: `${student.firstName} ${student.lastName}`,
      courseName: course.title,
      learningOutcomes: course.learningOutcomes || [],
      signatureUrl: settings.certificateSignatureUrl,
      logoUrl: settings.certificateLogoUrl,
      signatoryName: SIGNATORY_NAME,
      signatoryTitle: SIGNATORY_TITLE,
      classification: classifyScore(averageScore),
    })

    enrollment.certificateId = certificate._id
    enrollment.completedAt = new Date()
    await enrollment.save()
  }

  const pdfBuffer = await renderSelfPacedCertificatePdf({
    studentName: certificate.studentName,
    courseName: certificate.courseName,
    learningOutcomes: certificate.learningOutcomes,
    logoUrl: certificate.logoUrl,
    signatureUrl: certificate.signatureUrl,
    signatoryName: certificate.signatoryName,
    signatoryTitle: certificate.signatoryTitle,
    classification: certificate.classification,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
  })

  return new NextResponse(Uint8Array.from(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.certificateNumber}.pdf"`,
    },
  })
}