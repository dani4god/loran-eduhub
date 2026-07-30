// app/api/admin/enrollments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Student from '@/models/Student'
import { syncStudentDiscordRoles } from '@/lib/discordSync'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const enrollment = await Enrollment.findById(id)
  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  enrollment.status = 'withdrawn'
  enrollment.withdrawnAt = new Date()
  await enrollment.save()

  const student = await Student.findById(enrollment.studentId)
  if (student?.discordId) {
    await syncStudentDiscordRoles(student._id.toString(), student.discordId).catch(() => {})
  }

  return NextResponse.json({ success: true })
}