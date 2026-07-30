// app/api/admin/tutors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Tutor from '@/models/Tutor'
import Enrollment from '@/models/Enrollment'
import { removeGuildMember } from '@/lib/discord'
import { LORAN_GUILD_ID } from '@/lib/discordRoleMap'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin removes specific course(s) from what a tutor teaches.
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseIds } = await req.json()
  if (!Array.isArray(courseIds)) {
    return NextResponse.json({ error: 'courseIds must be an array' }, { status: 400 })
  }

  await connectDB()
  const tutor = await Tutor.findById(id)
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  tutor.courses = courseIds
  await tutor.save()

  return NextResponse.json({ success: true, courses: courseIds })
}

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

  const tutor = await Tutor.findById(id)
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  // Admin-initiated removal force-withdraws any active/paused students —
  // unlike the tutor's own self-delete route, which blocks instead.
  await Enrollment.updateMany(
    { tutorId: tutor._id, status: { $in: ['active', 'paused'] } },
    { status: 'withdrawn', withdrawnAt: new Date() }
  )

  if (tutor.discordId && LORAN_GUILD_ID) {
    await removeGuildMember(LORAN_GUILD_ID, tutor.discordId).catch(() => {})
  }

  await User.findByIdAndUpdate(tutor.userId, {
    isActive: false,
    deletedAt: new Date(),
    email: `deleted-${tutor.userId}@loraneduhub.invalid`,
    discordId: null, discordUsername: null, discordAccessToken: null, discordRefreshToken: null,
  })

  await Tutor.findByIdAndUpdate(tutor._id, {
    firstName: 'Deleted', lastName: 'Tutor', bio: '', profileImage: null,
    discordId: null, discordUsername: null, discordRoles: [],
  })

  return NextResponse.json({ success: true })
}