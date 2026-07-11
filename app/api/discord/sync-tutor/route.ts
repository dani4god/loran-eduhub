// app/api/discord/sync-tutor/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import User from '@/models/User'
import Course from '@/models/Course'
import {
  getGuildRoles,
  addMemberToGuild,
  getGuildMember,
  assignRolesToMember,
} from '@/lib/discord'
import {
  getTutorRoleNames,
  MEMBER_ROLE_NAME,
  LORAN_GUILD_ID,
} from '@/lib/discordRoleMap'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!LORAN_GUILD_ID) {
      return NextResponse.json({ error: 'Discord server not configured' }, { status: 500 })
    }

    await connectDB()

    const tutor = await Tutor.findOne({ userId: session.user.id })
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    if (!tutor.discordId) {
      return NextResponse.json({
        error: 'Discord not connected. Please connect your Discord account first.',
      }, { status: 400 })
    }

    if (tutor.status !== 'approved') {
      return NextResponse.json({
        error: 'Only approved tutors can be synced to Discord.',
      }, { status: 403 })
    }

    const user = await User.findById(tutor.userId)
    if (!user?.discordAccessToken) {
      return NextResponse.json({
        error: 'Discord access token missing. Please reconnect Discord.',
      }, { status: 400 })
    }

    const guildId = LORAN_GUILD_ID

    // Get tutor's course categories
    const courses = await Course.find({
      _id: { $in: tutor.courses },
      isActive: true,
    }).select('category')

    const categories = courses.map((c: any) => c.category)
    const targetRoleNames = getTutorRoleNames(categories)
    targetRoleNames.push(MEMBER_ROLE_NAME)

    // Fetch guild roles
    let guildRoles: any[]
    try {
      guildRoles = await getGuildRoles(guildId)
    } catch (err: any) {
      return NextResponse.json(
        { error: `Could not fetch Discord roles: ${err.message}` },
        { status: 502 }
      )
    }

    const roleByName = new Map<string, string>(
      guildRoles.map((r: any) => [r.name, r.id])
    )

    const matchedRoleIds: string[] = []
    const missingRoles: string[] = []

    for (const name of targetRoleNames) {
      const id = roleByName.get(name)
      if (id) {
        matchedRoleIds.push(id)
      } else {
        missingRoles.push(name)
      }
    }

    // Add to guild if not already a member
    const member = await getGuildMember(guildId, tutor.discordId)
    if (!member) {
      await addMemberToGuild(guildId, tutor.discordId, user.discordAccessToken)
    }

    // Assign roles
    await assignRolesToMember(guildId, tutor.discordId, matchedRoleIds)

    // Update stored roles
    await Tutor.findByIdAndUpdate(tutor._id, {
      discordRoles: targetRoleNames,
    })

    return NextResponse.json({
      success: true,
      message: 'Tutor synced to Discord server successfully',
      assignedRoles: targetRoleNames.filter(n => !missingRoles.includes(n)),
      missingRoles,
    })
  } catch (error: any) {
    console.error('Tutor sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync tutor' },
      { status: 500 }
    )
  }
}