// app/api/certificates/verify/[certificateNumber]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  const { certificateNumber } = await params

  await connectDB()

  const certificate = await Certificate.findOne({ certificateNumber })

  if (!certificate) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({
    valid: true,
    studentName: certificate.studentName,
    courseName: certificate.courseName,
    tutorName: certificate.tutorName,
    classification: certificate.classification,
    averageScore: certificate.averageScore,
    issuedAt: certificate.issuedAt,
    certificateNumber: certificate.certificateNumber,
  })
}