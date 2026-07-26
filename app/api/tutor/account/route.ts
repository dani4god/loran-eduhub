// app/api/tutor/account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Tutor from '@/models/Tutor'
import Enrollment from '@/models/Enrollment'
import bcrypt from 'bcryptjs'
import { removeGuildMember } from '@/lib/discord'
import { LORAN_GUILD_ID } from '@/lib/discordRoleMap'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
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

  const tutor = await Tutor.findOne({ userId: user._id })
  if (!tutor) return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })

  // Safety guard: block deletion while students are actively depending on
  // this tutor. They must wait for enrollments to naturally end/expire, or
  // contact support for a transfer, before the account can be deleted.
  const activeStudentCount = await Enrollment.countDocuments({
    tutorId: tutor._id,
    status: { $in: ['active', 'paused'] },
  })
  if (activeStudentCount > 0) {
    return NextResponse.json(
      {
        error: `You still have ${activeStudentCount} student${activeStudentCount !== 1 ? 's' : ''} actively enrolled with you. Please contact support to transfer or wait until their enrollments end before deleting your account.`,
      },
      { status: 400 }
    )
  }

  // Best-effort Discord removal — doesn't block deletion if it fails.
  if (tutor.discordId && LORAN_GUILD_ID) {
    await removeGuildMember(LORAN_GUILD_ID, tutor.discordId).catch(() => {})
  }

  // Soft delete: deactivate login, anonymize personal data, keep historical
  // records (past enrollments/payments/certificates) intact for audit.
  await User.findByIdAndUpdate(user._id, {
    isActive: false,
    deletedAt: new Date(),
    email: `deleted-${user._id}@loraneduhub.invalid`,
    discordId: null,
    discordUsername: null,
    discordAccessToken: null,
    discordRefreshToken: null,
  })

  await Tutor.findByIdAndUpdate(tutor._id, {
    firstName: 'Deleted',
    lastName: 'Tutor',
    bio: '',
    profileImage: null,
    phone: '',
    videoLink: null,
    resume: null,
    discordId: null,
    discordUsername: null,
    discordRoles: [],
    certificateSignatureUrl: null,
    certificateLogoUrl: null,
  })

  return NextResponse.json({ success: true })
}