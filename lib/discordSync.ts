// lib/discordSync.ts
import connectDB from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import Student from '@/models/Student'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import {
  getGuildRoles,
  getGuildMember,
  addMemberToGuild,
  addRoleToMember,
  removeRoleFromMember,
} from '@/lib/discord'
import {
  getStudentRoleName,
  getSelfPacedStudentRoleName,
  PLAN_ROLE_MAP,
  PAID_ROLE_NAME,
  EXPIRED_ROLE_NAME,
  SUSPENDED_ROLE_NAME,
  MEMBER_ROLE_NAME,
  ADMIN_ROLE_NAME,
  CATEGORY_TO_ROLE_GROUP,
  LORAN_GUILD_ID,
} from '@/lib/discordRoleMap'

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

  if (expiredEnrollments.length > 0) {
    targetNames.add(EXPIRED_ROLE_NAME)
  }

  const guildRoles = await getGuildRoles(guildId)
  const roleByName = new Map<string, string>(guildRoles.map((r: any) => [r.name, r.id]))

  const targetRoleIds = new Set(
    Array.from(targetNames).map((name) => roleByName.get(name)).filter(Boolean) as string[]
  )
  const managedRoleIds = new Set(
    getAllManagedStudentRoleNames().map((name) => roleByName.get(name)).filter(Boolean) as string[]
  )

  let member = await getGuildMember(guildId, discordId)
  if (!member && accessToken) {
    await addMemberToGuild(guildId, discordId, accessToken)
    member = await getGuildMember(guildId, discordId)
  }

  const currentRoleIds = new Set<string>(member?.roles || [])
  const toAdd = Array.from(targetRoleIds).filter((id) => !currentRoleIds.has(id))
  const toRemove = Array.from(currentRoleIds).filter((id) => managedRoleIds.has(id) && !targetRoleIds.has(id))

  await Promise.all([
    ...toAdd.map((id) => addRoleToMember(guildId, discordId, id).catch(() => {})),
    ...toRemove.map((id) => removeRoleFromMember(guildId, discordId, id).catch(() => {})),
  ])

  const finalNames = Array.from(targetNames)
  await Student.findByIdAndUpdate(studentId, { discordRoles: finalNames })
  return finalNames
}

export async function syncAdminDiscordRoles(
  adminId: string,
  discordId: string,
  accessToken?: string
): Promise<string[]> {
  const guildId = LORAN_GUILD_ID
  if (!guildId) return []

  const Admin = (await import('@/models/Admin')).default
  const targetNames = [MEMBER_ROLE_NAME, ADMIN_ROLE_NAME]

  const guildRoles = await getGuildRoles(guildId)
  const roleByName = new Map<string, string>(guildRoles.map((r: any) => [r.name, r.id]))
  const targetRoleIds = targetNames.map((n) => roleByName.get(n)).filter(Boolean) as string[]

  let member = await getGuildMember(guildId, discordId)
  if (!member && accessToken) {
    await addMemberToGuild(guildId, discordId, accessToken)
    member = await getGuildMember(guildId, discordId)
  }

  const currentRoleIds = new Set<string>(member?.roles || [])
  const toAdd = targetRoleIds.filter((id) => !currentRoleIds.has(id))
  await Promise.all(toAdd.map((id) => addRoleToMember(guildId, discordId, id).catch(() => {})))

  await Admin.findByIdAndUpdate(adminId, { discordRoles: targetNames })
  return targetNames
}

// Roles derived from the categories of self-paced courses the student
// actually OWNS — a student who owns an IELTS course and a Tech course
// gets both "IELTS Self Paced Student" and "Tech Innovations Self Paced
// Student", never a mismatched or generic role.
export async function syncSelfPacedStudentDiscordRoles(
  spStudentId: string,
  discordId: string,
  accessToken?: string
): Promise<string[]> {
  const guildId = LORAN_GUILD_ID
  if (!guildId) return []

  await connectDB()

  const enrollments = await SelfPacedEnrollment.find({ selfPacedStudentId: spStudentId })
  const courseIds = enrollments.map((e: any) => e.courseId)
  const courses = await SelfPacedCourse.find({ _id: { $in: courseIds } }).select('category')

  const targetNames = new Set<string>([MEMBER_ROLE_NAME])
  for (const course of courses) {
    if (course.category) {
      targetNames.add(getSelfPacedStudentRoleName(course.category))
    }
  }

  const guildRoles = await getGuildRoles(guildId)
  const roleByName = new Map<string, string>(guildRoles.map((r: any) => [r.name, r.id]))
  const targetRoleIds = Array.from(targetNames).map((n) => roleByName.get(n)).filter(Boolean) as string[]

  let member = await getGuildMember(guildId, discordId)
  if (!member && accessToken) {
    await addMemberToGuild(guildId, discordId, accessToken)
    member = await getGuildMember(guildId, discordId)
  }

  const currentRoleIds = new Set<string>(member?.roles || [])
  const toAdd = targetRoleIds.filter((id) => !currentRoleIds.has(id))
  await Promise.all(toAdd.map((id) => addRoleToMember(guildId, discordId, id).catch(() => {})))

  const finalNames = Array.from(targetNames)
  await SelfPacedStudent.findByIdAndUpdate(spStudentId, { discordRoles: finalNames })
  return finalNames
}


const EXAM_PREP_ROLE_NAME = 'Exam Preparation Student'

export async function syncExamPrepStudentDiscordRoles(examPrepStudentId: string, discordId: string, accessToken?: string): Promise<string[]> {
  const guildId = LORAN_GUILD_ID
  if (!guildId) return []
  const targetNames = [MEMBER_ROLE_NAME, EXAM_PREP_ROLE_NAME]
  const guildRoles = await getGuildRoles(guildId)
  const roleByName = new Map<string, string>(guildRoles.map((r: any) => [r.name, r.id]))
  const targetRoleIds = targetNames.map((n) => roleByName.get(n)).filter(Boolean) as string[]
  let member = await getGuildMember(guildId, discordId)
  if (!member && accessToken) { await addMemberToGuild(guildId, discordId, accessToken); member = await getGuildMember(guildId, discordId) }
  const currentRoleIds = new Set<string>(member?.roles || [])
  const toAdd = targetRoleIds.filter((id) => !currentRoleIds.has(id))
  await Promise.all(toAdd.map((id) => addRoleToMember(guildId, discordId, id).catch(() => {})))
  await ExamPrepStudent.findByIdAndUpdate(examPrepStudentId, { discordRoles: targetNames })
  return targetNames
}