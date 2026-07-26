// app/api/student/account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import bcrypt from 'bcryptjs'
import { removeGuildMember } from '@/lib/discord'
import { LORAN_GUILD_ID } from '@/lib/discordRoleMap'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { password } = await req.json()
  if (!password) {
    return NextResponse.json({ error: 'Password is required to confirm deletion' }, { status: 400 })
  }

  await connectDB()

  const user = await User.findById(session.user.id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
  }

  const student = await Student.findOne({ userId: user._id })
  if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

  // Withdraw from all active/paused enrollments as part of deletion — no
  // refund (same as a manual withdrawal), but this cleanly ends the
  // relationship on each course rather than leaving dangling active state.
  await Enrollment.updateMany(
    { studentId: student._id, status: { $in: ['active', 'paused'] } },
    { status: 'withdrawn', withdrawnAt: new Date() }
  )

  if (student.discordId && LORAN_GUILD_ID) {
    await removeGuildMember(LORAN_GUILD_ID, student.discordId).catch(() => {})
  }

  await User.findByIdAndUpdate(user._id, {
    isActive: false,
    deletedAt: new Date(),
    email: `deleted-${user._id}@loraneduhub.invalid`,
    discordId: null,
    discordUsername: null,
    discordAccessToken: null,
    discordRefreshToken: null,
  })

  await Student.findByIdAndUpdate(student._id, {
    firstName: 'Deleted',
    lastName: 'Student',
    phone: '',
    profileImage: null,
    discordId: null,
    discordUsername: null,
    discordRoles: [],
  })

  return NextResponse.json({ success: true })
}