// app/api/student/certificates/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Certificate from '@/models/Certificate'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const certificates = await Certificate.find({ studentId: student._id }).sort({ createdAt: -1 })

  return NextResponse.json({
    certificates: certificates.map(c => ({
      _id: c._id.toString(),
      studentName: c.studentName,
      nameEdited: c.nameEdited,
      courseName: c.courseName,
      tutorName: c.tutorName,
      classification: c.classification,
      averageScore: c.averageScore,
      certificateNumber: c.certificateNumber,
      issuedAt: c.issuedAt,
      viewedByStudent: c.viewedByStudent,
    })),
  })
}