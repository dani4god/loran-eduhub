// app/api/student/certificates/[id]/acknowledge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Certificate from '@/models/Certificate'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const certificate = await Certificate.findById(id)
  if (!certificate || certificate.studentId.toString() !== student._id.toString()) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  certificate.viewedByStudent = true
  await certificate.save()

  return NextResponse.json({ success: true })
}