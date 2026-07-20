// app/api/certificates/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Tutor from '@/models/Tutor'
import Certificate from '@/models/Certificate'
import { renderCertificatePdf } from '@/lib/certificatePdf'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const certificate = await Certificate.findById(id)
  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  // Only the owning student or the issuing tutor may download.
  let authorized = false
  if (session.user.role === 'student') {
    const student = await Student.findOne({ userId: session.user.id })
    authorized = !!student && certificate.studentId.toString() === student._id.toString()
  } else if (session.user.role === 'tutor') {
    const tutor = await Tutor.findOne({ userId: session.user.id })
    authorized = !!tutor && certificate.tutorId.toString() === tutor._id.toString()
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const pdfBuffer = await renderCertificatePdf(certificate)

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.certificateNumber}.pdf"`,
    },
 })
}