// app/api/discord/sync-student/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import User from '@/models/User'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import {
  getGuildRoles,
  addMemberToGuild,
  getGuildMember,
  assignRolesToMember,
} from '@/lib/discord'
import {
  getStudentRoleName,
  PLAN_ROLE_MAP,
  PAID_ROLE_NAME,
  MEMBER_ROLE_NAME,
  LORAN_GUILD_ID,
} from '@/lib/discordRoleMap'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!LORAN_GUILD_ID) {
      return NextResponse.json({ error: 'Discord server not configured' }, { status: 500 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.discordId) {
      return NextResponse.json({
        error: 'Discord not connected. Please connect your Discord account first.',
      }, { status: 400 })
    }

    const user = await User.findById(student.userId)
    if (!user?.discordAccessToken) {
      return NextResponse.json({
        error: 'Discord access token missing. Please reconnect Discord.',
      }, { status: 400 })
    }

    const guildId = LORAN_GUILD_ID

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'active',
    })

    const targetRoleNames = new Set<string>([MEMBER_ROLE_NAME])

    if (enrollments.length > 0) {
      const courseIds = enrollments.map(e => e.courseId)
      const courses = await Course.find({ _id: { $in: courseIds } }).select('category')
      const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))

      for (const enrollment of enrollments) {
        const course = courseById.get(enrollment.courseId.toString())
        if (!course) continue

        targetRoleNames.add(getStudentRoleName(course.category))

        const planRoleName = PLAN_ROLE_MAP[enrollment.plan]
        if (planRoleName) targetRoleNames.add(planRoleName)

        if (enrollment.plan !== 'trial') targetRoleNames.add(PAID_ROLE_NAME)
      }
    }

    const roleNamesArr = Array.from(targetRoleNames)

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

    for (const name of roleNamesArr) {
      const id = roleByName.get(name)
      if (id) matchedRoleIds.push(id)
      else missingRoles.push(name)
    }

    const member = await getGuildMember(guildId, student.discordId)
    if (!member) {
      await addMemberToGuild(guildId, student.discordId, user.discordAccessToken)
    }

    await assignRolesToMember(guildId, student.discordId, matchedRoleIds)

    await Student.findByIdAndUpdate(student._id, {
      discordRoles: roleNamesArr,
    })

    return NextResponse.json({
      success: true,
      message: 'Synced to Discord server successfully',
      assignedRoles: roleNamesArr.filter(n => !missingRoles.includes(n)),
      missingRoles,
    })
  } catch (error: any) {
    console.error('Student sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync' },
      { status: 500 }
    )
  }
}