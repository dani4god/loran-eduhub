// app/api/admin/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import { removeGuildMember } from '@/lib/discord'
import { LORAN_GUILD_ID } from '@/lib/discordRoleMap'

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

  const student = await Student.findById(id)
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  await Enrollment.updateMany(
    { studentId: student._id, status: { $in: ['active', 'paused'] } },
    { status: 'withdrawn', withdrawnAt: new Date() }
  )

  if (student.discordId && LORAN_GUILD_ID) {
    await removeGuildMember(LORAN_GUILD_ID, student.discordId).catch(() => {})
  }

  await User.findByIdAndUpdate(student.userId, {
    isActive: false,
    deletedAt: new Date(),
    email: `deleted-${student.userId}@loraneduhub.invalid`,
    discordId: null, discordUsername: null, discordAccessToken: null, discordRefreshToken: null,
  })

  await Student.findByIdAndUpdate(student._id, {
    firstName: 'Deleted', lastName: 'Student', phone: '', profileImage: null,
    discordId: null, discordUsername: null, discordRoles: [],
  })

  return NextResponse.json({ success: true })
}