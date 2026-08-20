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
import Tutor from '@/models/Tutor'
import { isCourseComplete, computeAverageScore, classifyScore } from '@/lib/selfPaced'
import { generateCertificateNumber } from '@/lib/certificate'
import { renderCertificatePdf } from '@/lib/certificatePdf'

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

  // Check if the course is complete
  if (!isCourseComplete(course, enrollment)) {
    return NextResponse.json({ error: 'Complete every week to unlock your certificate' }, { status: 400 })
  }

  // Check if the student has left a review for this course
  const hasReviewed = await SelfPacedCourseReview.findOne({ 
    selfPacedStudentId: student._id, 
    courseId: id 
  })
  if (!hasReviewed) {
    return NextResponse.json({ 
      error: 'Please leave a course review before downloading your certificate', 
      reviewRequired: true 
    }, { status: 400 })
  }

  let certificate = enrollment.certificateId
    ? await SelfPacedCertificate.findById(enrollment.certificateId)
    : null

  if (!certificate) {
    const tutor = await Tutor.findById(course.tutorId)
    if (!course.certificateSignatureUrl || !course.certificateLogoUrl) {
      return NextResponse.json({ error: 'The tutor has not set up certificate assets for this course yet' }, { status: 400 })
    }

    const averageScore = computeAverageScore(enrollment)
    certificate = await SelfPacedCertificate.create({
      selfPacedStudentId: student._id,
      courseId: course._id,
      tutorId: course.tutorId,
      enrollmentId: enrollment._id,
      certificateNumber: generateCertificateNumber(),
      studentName: `${student.firstName} ${student.lastName}`,
      courseName: course.title,
      tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Loran EduHub',
      signatureUrl: course.certificateSignatureUrl,
      logoUrl: course.certificateLogoUrl,
      averageScore,
      classification: classifyScore(averageScore),
    })

    enrollment.certificateId = certificate._id
    enrollment.completedAt = new Date()
    await enrollment.save()
  }

  // Reuses the same PDF renderer built for course-completion certificates —
  // the shape it expects (studentName, courseName, tutorName, signatureUrl,
  // logoUrl, averageScore, classification, certificateNumber, durationStart/End,
  // issuedAt) matches closely enough that we pass enrollment dates as the
  // duration range.
  const pdfBuffer = await renderCertificatePdf({
    ...certificate.toObject(),
    durationStart: enrollment.createdAt,
    durationEnd: enrollment.completedAt || new Date(),
    issuedAt: certificate.issuedAt,
  } as any)

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.certificateNumber}.pdf"`,
    },
  })
}