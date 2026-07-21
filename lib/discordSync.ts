// lib/discordSync.ts
import connectDB from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import Student from '@/models/Student'
import {
  getGuildRoles,
  getGuildMember,
  addMemberToGuild,
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
  CATEGORY_TO_ROLE_GROUP,
  LORAN_GUILD_ID,
} from '@/lib/discordRoleMap'

// Every role name this app is allowed to manage for a student. Anything a
// student holds OUTSIDE this list (e.g. a role an admin manually assigned)
// is left untouched by sync — we only add/remove roles we own.
function getAllManagedStudentRoleNames(): string[] {
  const courseRoles = Object.keys(CATEGORY_TO_ROLE_GROUP).map(getStudentRoleName)
  const planRoles = Object.values(PLAN_ROLE_MAP)
  return [
    ...courseRoles,
    ...planRoles,
    PAID_ROLE_NAME,
    EXPIRED_ROLE_NAME,
    SUSPENDED_ROLE_NAME,
    MEMBER_ROLE_NAME,
  ]
}

// Full reconciliation: computes the role set a student SHOULD have based on
// their currently-active enrollments only, then adds what's missing and
// removes any managed role they still hold but shouldn't (e.g. after a
// withdrawal, pause, or expiry). This replaces any narrower, single-role
// add/remove call — those left stale roles behind.
export async function syncStudentDiscordRoles(
  studentId: string,
  discordId: string,
  accessToken?: string
): Promise<string[]> {
  const guildId = LORAN_GUILD_ID
  if (!guildId) return []

  await connectDB()

  const [activeEnrollments, expiredEnrollments] = await Promise.all([
    Enrollment.find({ studentId, status: 'active' }),
    Enrollment.find({ studentId, status: 'expired' }),
  ])

  const targetNames = new Set<string>([MEMBER_ROLE_NAME])

  if (activeEnrollments.length > 0) {
    const courseIds = activeEnrollments.map((e: any) => e.courseId)
    const courses = await Course.find({ _id: { $in: courseIds } }).select('category')
    const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))

    for (const enrollment of activeEnrollments) {
      const course = courseById.get(enrollment.courseId.toString())
      if (!course) continue

      targetNames.add(getStudentRoleName(course.category))

      const planRoleName = PLAN_ROLE_MAP[enrollment.plan]
      if (planRoleName) targetNames.add(planRoleName)

      if (enrollment.plan !== 'trial') targetNames.add(PAID_ROLE_NAME)
    }
  }

  // If the student has ANY expired enrollment, they carry the "Expired"
  // role — this is what makes expiry visible in Discord itself, not just
  // in the database.
  if (expiredEnrollments.length > 0) {
    targetNames.add(EXPIRED_ROLE_NAME)
  }

  const guildRoles = await getGuildRoles(guildId)
  const roleByName = new Map<string, string>(guildRoles.map((r: any) => [r.name, r.id]))

  const targetRoleIds = new Set(
    Array.from(targetNames)
      .map(name => roleByName.get(name))
      .filter(Boolean) as string[]
  )

  const managedRoleIds = new Set(
    getAllManagedStudentRoleNames()
      .map(name => roleByName.get(name))
      .filter(Boolean) as string[]
  )

  let member = await getGuildMember(guildId, discordId)
  if (!member && accessToken) {
    await addMemberToGuild(guildId, discordId, accessToken)
    member = await getGuildMember(guildId, discordId)
  }

  const currentRoleIds = new Set<string>(member?.roles || [])

  const toAdd = Array.from(targetRoleIds).filter(id => !currentRoleIds.has(id))
  const toRemove = Array.from(currentRoleIds).filter(
    id => managedRoleIds.has(id) && !targetRoleIds.has(id)
  )

  await Promise.all([
    ...toAdd.map(id => addRoleToMember(guildId, discordId, id).catch(() => {})),
    ...toRemove.map(id => removeRoleFromMember(guildId, discordId, id).catch(() => {})),
  ])

  const finalNames = Array.from(targetNames)
  await Student.findByIdAndUpdate(studentId, { discordRoles: finalNames })

  return finalNames
}