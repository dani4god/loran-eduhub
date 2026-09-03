// app/api/exam-prep/discord/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

import {
  hasExamPrepCommunityAccess,
  syncExamPrepStudentDiscordRoles,
} from '@/lib/discordSync'

import {
  LORAN_GUILD_ID,
} from '@/lib/discordRoleMap'

// ============================================================
// GET COMMUNITY STATUS
// ============================================================

export async function GET(
  req:
    NextRequest
) {
  try {
    const auth =
      await requireExamPrepStudent(
        req
      )

    if (
      !auth.ok
    ) {
      return auth.response
    }

    await connectDB()

    const student =
      auth.student

    const hasCommunityAccess =
      await hasExamPrepCommunityAccess(
        String(
          student._id
        )
      )

    let discordRoles:
      string[] =
        Array.isArray(
          student.discordRoles
        )
          ? student.discordRoles
          : []

    /*
     * Re-sync when the student opens the page.
     *
     * This also removes the protected Exam Preparation
     * Student role when access has expired.
     */
    if (
      student.discordId
    ) {
      try {
        discordRoles =
          await syncExamPrepStudentDiscordRoles(
            String(
              student._id
            ),
            String(
              student.discordId
            )
          )
      } catch (
        syncError
      ) {
        console.error(
          'Exam Prep Discord status sync:',
          syncError
        )
      }
    }

    const communityUrl =
      LORAN_GUILD_ID
        ? `https://discord.com/channels/${LORAN_GUILD_ID}`
        : null

    return NextResponse.json({
      success:
        true,

      isConnected:
        Boolean(
          student.discordId
        ),

      discordUsername:
        student.discordUsername ||
        null,

      discordRoles,

      hasCommunityAccess,

      requiresSubscription:
        !hasCommunityAccess,

      communityUrl,

      student: {
        fullName:
          student.fullName ||
          '',

        regNumber:
          student.regNumber ||
          '',
      },
    })
  } catch (
    error
  ) {
    console.error(
      'Exam Prep Discord status:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load Discord community status.',
      },
      {
        status:
          500,
      }
    )
  }
}