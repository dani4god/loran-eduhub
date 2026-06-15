// app/api/discord/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import User from '@/models/User'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import {
  getGuildRoles,
  addMemberToGuild,
  getGuildMember,
  addRoleToMember,
  removeRoleFromMember,
} from '@/lib/discord'
import {
  getStudentRoleName,
  PLAN_ROLE_MAP,
  PAID_ROLE_NAME,
  EXPIRED_ROLE_NAME,
  SUSPENDED_ROLE_NAME,
  MEMBER_ROLE_NAME,
} from '@/lib/discordRoleMap'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor?.discordServerId) {
    return NextResponse.json({ error: 'No Discord server connected' }, { status: 400 })
  }

  const guildId = tutor.discordServerId

  let roles: any[]
  try {
    roles = await getGuildRoles(guildId)
  } catch (err: any) {
    return NextResponse.json(
      { error: `Could not fetch roles: ${err.message}` },
      { status: 502 }
    )
  }

  const roleByName = new Map<string, string>(roles.map((r: any) => [r.name, r.id]))

  const enrollments = await Enrollment.find({ tutorId: tutor._id })

  const results: any[] = []

  for (const enrollment of enrollments) {
    const student = await Student.findById(enrollment.studentId)
    const course = await Course.findById(enrollment.courseId)
    if (!student || !course) continue

    const user = await User.findById(student.userId)
    if (!user?.discordId || !user?.discordAccessToken) {
      results.push({
        student: `${student.firstName} ${student.lastName}`,
        status: 'no_discord_linked',
      })
      continue
    }

    const studentRoleName = getStudentRoleName(course.category)
    const studentRoleId = roleByName.get(studentRoleName)
    const planRoleName = PLAN_ROLE_MAP[enrollment.plan]
    const planRoleId = planRoleName ? roleByName.get(planRoleName) : undefined
    const expiredRoleId = roleByName.get(EXPIRED_ROLE_NAME)
    const suspendedRoleId = roleByName.get(SUSPENDED_ROLE_NAME)
    const paidRoleId = roleByName.get(PAID_ROLE_NAME)
    const memberRoleId = roleByName.get(MEMBER_ROLE_NAME)

    if (!studentRoleId) {
      results.push({
        student: `${student.firstName} ${student.lastName}`,
        status: 'role_not_found',
        missingRole: studentRoleName,
      })
      continue
    }

    try {
      let member = await getGuildMember(guildId, user.discordId)
      if (!member) {
        await addMemberToGuild(guildId, user.discordId, user.discordAccessToken)
      }

      const isActive = enrollment.status === 'active'
      const isExpired = enrollment.status === 'expired'
      const isSuspendedOrPaused =
        enrollment.status === 'suspended' || enrollment.status === 'paused'
      const isTrial = enrollment.plan === 'trial'

      if (isActive) {
        await addRoleToMember(guildId, user.discordId, studentRoleId)
        if (planRoleId) await addRoleToMember(guildId, user.discordId, planRoleId)
        if (memberRoleId) await addRoleToMember(guildId, user.discordId, memberRoleId)

        // Paid = active and not on the trial plan
        if (!isTrial && paidRoleId) {
          await addRoleToMember(guildId, user.discordId, paidRoleId)
        }

        if (expiredRoleId) {
          await removeRoleFromMember(guildId, user.discordId, expiredRoleId).catch(() => {})
        }
        if (suspendedRoleId) {
          await removeRoleFromMember(guildId, user.discordId, suspendedRoleId).catch(() => {})
        }
      } else if (isExpired) {
        if (expiredRoleId) await addRoleToMember(guildId, user.discordId, expiredRoleId)
        await removeRoleFromMember(guildId, user.discordId, studentRoleId).catch(() => {})
        if (planRoleId) {
          await removeRoleFromMember(guildId, user.discordId, planRoleId).catch(() => {})
        }
        if (paidRoleId) {
          await removeRoleFromMember(guildId, user.discordId, paidRoleId).catch(() => {})
        }
      } else if (isSuspendedOrPaused) {
        if (suspendedRoleId) await addRoleToMember(guildId, user.discordId, suspendedRoleId)
        await removeRoleFromMember(guildId, user.discordId, studentRoleId).catch(() => {})
        if (planRoleId) {
          await removeRoleFromMember(guildId, user.discordId, planRoleId).catch(() => {})
        }
      }
      // status === 'pending': enrollment not yet active — no Discord role changes

      results.push({
        student: `${student.firstName} ${student.lastName}`,
        status: 'synced',
        enrollmentStatus: enrollment.status,
        courseRole: studentRoleName,
      })
    } catch (err: any) {
      results.push({
        student: `${student.firstName} ${student.lastName}`,
        status: 'error',
        error: err.message,
      })
    }
  }

  return NextResponse.json({ success: true, results })
}