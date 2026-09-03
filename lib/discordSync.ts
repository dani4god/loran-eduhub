// lib/discordSync.ts

import connectDB from '@/lib/mongodb'

import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import Student from '@/models/Student'

import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'

import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'

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

// ============================================================
// REGULAR STUDENT MANAGED ROLES
// ============================================================

function getAllManagedStudentRoleNames(): string[] {
  const courseRoles =
    Object
      .keys(
        CATEGORY_TO_ROLE_GROUP
      )
      .map(
        getStudentRoleName
      )

  const planRoles =
    Object.values(
      PLAN_ROLE_MAP
    )

  return [
    ...courseRoles,
    ...planRoles,
    PAID_ROLE_NAME,
    EXPIRED_ROLE_NAME,
    SUSPENDED_ROLE_NAME,
    MEMBER_ROLE_NAME,
  ]
}

// ============================================================
// REGULAR STUDENT
// ============================================================

export async function syncStudentDiscordRoles(
  studentId: string,
  discordId: string,
  accessToken?: string
): Promise<string[]> {
  const guildId =
    LORAN_GUILD_ID

  if (
    !guildId
  ) {
    return []
  }

  await connectDB()

  const [
    activeEnrollments,
    expiredEnrollments,
  ] =
    await Promise.all([
      Enrollment.find({
        studentId,
        status:
          'active',
      }),

      Enrollment.find({
        studentId,
        status:
          'expired',
      }),
    ])

  const targetNames =
    new Set<string>([
      MEMBER_ROLE_NAME,
    ])

  if (
    activeEnrollments.length >
    0
  ) {
    const courseIds =
      activeEnrollments.map(
        (
          enrollment:
            any
        ) =>
          enrollment.courseId
      )

    const courses =
      await Course.find({
        _id: {
          $in:
            courseIds,
        },
      }).select(
        'category'
      )

    const courseById =
      new Map(
        courses.map(
          (
            course:
              any
          ) => [
            course._id.toString(),
            course,
          ]
        )
      )

    for (
      const enrollment
      of activeEnrollments
    ) {
      const course =
        courseById.get(
          enrollment
            .courseId
            .toString()
        )

      if (
        !course
      ) {
        continue
      }

      targetNames.add(
        getStudentRoleName(
          course.category
        )
      )

      const planRoleName =
        PLAN_ROLE_MAP[
          enrollment.plan
        ]

      if (
        planRoleName
      ) {
        targetNames.add(
          planRoleName
        )
      }

      if (
        enrollment.plan !==
        'trial'
      ) {
        targetNames.add(
          PAID_ROLE_NAME
        )
      }
    }
  }

  if (
    expiredEnrollments.length >
    0
  ) {
    targetNames.add(
      EXPIRED_ROLE_NAME
    )
  }

  const guildRoles =
    await getGuildRoles(
      guildId
    )

  const roleByName =
    new Map<
      string,
      string
    >(
      guildRoles.map(
        (
          role:
            any
        ) => [
          role.name,
          role.id,
        ]
      )
    )

  const targetRoleIds =
    new Set(
      Array
        .from(
          targetNames
        )
        .map(
          (
            name
          ) =>
            roleByName.get(
              name
            )
        )
        .filter(
          Boolean
        ) as string[]
    )

  const managedRoleIds =
    new Set(
      getAllManagedStudentRoleNames()
        .map(
          (
            name
          ) =>
            roleByName.get(
              name
            )
        )
        .filter(
          Boolean
        ) as string[]
    )

  let member =
    await getGuildMember(
      guildId,
      discordId
    )

  if (
    !member &&
    accessToken
  ) {
    await addMemberToGuild(
      guildId,
      discordId,
      accessToken
    )

    member =
      await getGuildMember(
        guildId,
        discordId
      )
  }

  const currentRoleIds =
    new Set<string>(
      member?.roles ||
        []
    )

  const toAdd =
    Array
      .from(
        targetRoleIds
      )
      .filter(
        (
          id
        ) =>
          !currentRoleIds.has(
            id
          )
      )

  const toRemove =
    Array
      .from(
        currentRoleIds
      )
      .filter(
        (
          id
        ) =>
          managedRoleIds.has(
            id
          ) &&
          !targetRoleIds.has(
            id
          )
      )

  await Promise.all([
    ...toAdd.map(
      (
        id
      ) =>
        addRoleToMember(
          guildId,
          discordId,
          id
        ).catch(
          () => {}
        )
    ),

    ...toRemove.map(
      (
        id
      ) =>
        removeRoleFromMember(
          guildId,
          discordId,
          id
        ).catch(
          () => {}
        )
    ),
  ])

  const finalNames =
    Array.from(
      targetNames
    )

  await Student.findByIdAndUpdate(
    studentId,
    {
      discordRoles:
        finalNames,
    }
  )

  return finalNames
}

// ============================================================
// ADMIN
// ============================================================

export async function syncAdminDiscordRoles(
  adminId: string,
  discordId: string,
  accessToken?: string
): Promise<string[]> {
  const guildId =
    LORAN_GUILD_ID

  if (
    !guildId
  ) {
    return []
  }

  const Admin =
    (
      await import(
        '@/models/Admin'
      )
    ).default

  const targetNames = [
    MEMBER_ROLE_NAME,
    ADMIN_ROLE_NAME,
  ]

  const guildRoles =
    await getGuildRoles(
      guildId
    )

  const roleByName =
    new Map<
      string,
      string
    >(
      guildRoles.map(
        (
          role:
            any
        ) => [
          role.name,
          role.id,
        ]
      )
    )

  const targetRoleIds =
    targetNames
      .map(
        (
          name
        ) =>
          roleByName.get(
            name
          )
      )
      .filter(
        Boolean
      ) as string[]

  let member =
    await getGuildMember(
      guildId,
      discordId
    )

  if (
    !member &&
    accessToken
  ) {
    await addMemberToGuild(
      guildId,
      discordId,
      accessToken
    )

    member =
      await getGuildMember(
        guildId,
        discordId
      )
  }

  const currentRoleIds =
    new Set<string>(
      member?.roles ||
        []
    )

  const toAdd =
    targetRoleIds.filter(
      (
        id
      ) =>
        !currentRoleIds.has(
          id
        )
    )

  await Promise.all(
    toAdd.map(
      (
        id
      ) =>
        addRoleToMember(
          guildId,
          discordId,
          id
        ).catch(
          () => {}
        )
    )
  )

  await Admin.findByIdAndUpdate(
    adminId,
    {
      discordRoles:
        targetNames,
    }
  )

  return targetNames
}

// ============================================================
// SELF-PACED STUDENT
// ============================================================

export async function syncSelfPacedStudentDiscordRoles(
  spStudentId: string,
  discordId: string,
  accessToken?: string
): Promise<string[]> {
  const guildId =
    LORAN_GUILD_ID

  if (
    !guildId
  ) {
    return []
  }

  await connectDB()

  const enrollments =
    await SelfPacedEnrollment.find({
      selfPacedStudentId:
        spStudentId,
    })

  const courseIds =
    enrollments.map(
      (
        enrollment:
          any
      ) =>
        enrollment.courseId
    )

  const courses =
    await SelfPacedCourse.find({
      _id: {
        $in:
          courseIds,
      },
    }).select(
      'category'
    )

  const targetNames =
    new Set<string>([
      MEMBER_ROLE_NAME,
    ])

  for (
    const course
    of courses
  ) {
    if (
      course.category
    ) {
      targetNames.add(
        getSelfPacedStudentRoleName(
          course.category
        )
      )
    }
  }

  const guildRoles =
    await getGuildRoles(
      guildId
    )

  const roleByName =
    new Map<
      string,
      string
    >(
      guildRoles.map(
        (
          role:
            any
        ) => [
          role.name,
          role.id,
        ]
      )
    )

  const targetRoleIds =
    Array
      .from(
        targetNames
      )
      .map(
        (
          name
        ) =>
          roleByName.get(
            name
          )
      )
      .filter(
        Boolean
      ) as string[]

  let member =
    await getGuildMember(
      guildId,
      discordId
    )

  if (
    !member &&
    accessToken
  ) {
    await addMemberToGuild(
      guildId,
      discordId,
      accessToken
    )

    member =
      await getGuildMember(
        guildId,
        discordId
      )
  }

  const currentRoleIds =
    new Set<string>(
      member?.roles ||
        []
    )

  const toAdd =
    targetRoleIds.filter(
      (
        id
      ) =>
        !currentRoleIds.has(
          id
        )
    )

  await Promise.all(
    toAdd.map(
      (
        id
      ) =>
        addRoleToMember(
          guildId,
          discordId,
          id
        ).catch(
          () => {}
        )
    )
  )

  const finalNames =
    Array.from(
      targetNames
    )

  await SelfPacedStudent.findByIdAndUpdate(
    spStudentId,
    {
      discordRoles:
        finalNames,
    }
  )

  return finalNames
}

// ============================================================
// EXAM PREP
// ============================================================

export const EXAM_PREP_ROLE_NAME =
  'Exam Preparation Student'

// ============================================================
// EXAM PREP COMMUNITY ACCESS
// ============================================================

export async function hasExamPrepCommunityAccess(
  examPrepStudentId:
    string
) {
  await connectDB()

  const [
    settings,
    subscription,
  ] =
    await Promise.all([
      ExamPrepSettings.findOne({
        key:
          'global',
      }),

      ExamPrepSubscription.findOne({
        examPrepStudentId,
      }),
    ])

  /*
   * Mirror the Exam Prep subscription rules.
   *
   * Global locking does NOT remove the Discord role.
   * A temporary admin lock should not throw students out
   * of their academic community.
   */

  const hasAccess =
    !settings?.isPaid ||
    subscription
      ?.wasFreeAtRegistration ===
      true ||
    subscription
      ?.planDuration ===
      'life' ||
    Boolean(
      subscription
        ?.endDate &&
        new Date(
          subscription.endDate
        ).getTime() >
          Date.now()
    )

  return hasAccess
}

// ============================================================
// SYNC EXAM PREP DISCORD ROLES
// ============================================================

export async function syncExamPrepStudentDiscordRoles(
  examPrepStudentId:
    string,
  discordId:
    string,
  accessToken?:
    string
): Promise<string[]> {
  const guildId =
    LORAN_GUILD_ID

  if (
    !guildId
  ) {
    return []
  }

  await connectDB()

  const hasAccess =
    await hasExamPrepCommunityAccess(
      examPrepStudentId
    )

  /*
   * Everyone who successfully links can remain a Member.
   *
   * The protected Exam Preparation Student role is only
   * assigned while the Loran Exam Prep account has access.
   */
  const targetNames =
    new Set<string>([
      MEMBER_ROLE_NAME,
    ])

  if (
    hasAccess
  ) {
    targetNames.add(
      EXAM_PREP_ROLE_NAME
    )
  }

  const managedNames = [
    MEMBER_ROLE_NAME,
    EXAM_PREP_ROLE_NAME,
  ]

  const guildRoles =
    await getGuildRoles(
      guildId
    )

  const roleByName =
    new Map<
      string,
      string
    >(
      guildRoles.map(
        (
          role:
            any
        ) => [
          role.name,
          role.id,
        ]
      )
    )

  const targetRoleIds =
    new Set(
      Array
        .from(
          targetNames
        )
        .map(
          (
            name
          ) =>
            roleByName.get(
              name
            )
        )
        .filter(
          Boolean
        ) as string[]
    )

  const managedRoleIds =
    new Set(
      managedNames
        .map(
          (
            name
          ) =>
            roleByName.get(
              name
            )
        )
        .filter(
          Boolean
        ) as string[]
    )

  let member =
    await getGuildMember(
      guildId,
      discordId
    )

  /*
   * Discord guilds.join requires the OAuth access token.
   * We normally have this token during the initial callback.
   */
  if (
    !member &&
    accessToken
  ) {
    await addMemberToGuild(
      guildId,
      discordId,
      accessToken
    )

    member =
      await getGuildMember(
        guildId,
        discordId
      )
  }

  const currentRoleIds =
    new Set<string>(
      member?.roles ||
        []
    )

  const toAdd =
    Array
      .from(
        targetRoleIds
      )
      .filter(
        (
          roleId
        ) =>
          !currentRoleIds.has(
            roleId
          )
      )

  const toRemove =
    Array
      .from(
        currentRoleIds
      )
      .filter(
        (
          roleId
        ) =>
          managedRoleIds.has(
            roleId
          ) &&
          !targetRoleIds.has(
            roleId
          )
      )

  await Promise.all([
    ...toAdd.map(
      (
        roleId
      ) =>
        addRoleToMember(
          guildId,
          discordId,
          roleId
        ).catch(
          () => {}
        )
    ),

    ...toRemove.map(
      (
        roleId
      ) =>
        removeRoleFromMember(
          guildId,
          discordId,
          roleId
        ).catch(
          () => {}
        )
    ),
  ])

  const finalNames =
    Array.from(
      targetNames
    )

  await ExamPrepStudent.findByIdAndUpdate(
    examPrepStudentId,
    {
      discordRoles:
        finalNames,
    }
  )

  return finalNames
}