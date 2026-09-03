// app/api/exam-prep/discord/sync/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

import {
  hasExamPrepCommunityAccess,
  syncExamPrepStudentDiscordRoles,
} from '@/lib/discordSync'

// ============================================================
// POST
// ============================================================

export async function POST(
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

    const student =
      auth.student

    if (
      !student.discordId
    ) {
      return NextResponse.json(
        {
          error:
            'Discord is not connected to this Exam Prep account yet.',
        },
        {
          status:
            400,
        }
      )
    }

    const hasCommunityAccess =
      await hasExamPrepCommunityAccess(
        String(
          student._id
        )
      )

    const assignedRoles =
      await syncExamPrepStudentDiscordRoles(
        String(
          student._id
        ),
        String(
          student.discordId
        )
      )

    return NextResponse.json({
      success:
        true,

      assignedRoles,

      hasCommunityAccess,

      requiresSubscription:
        !hasCommunityAccess,
    })
  } catch (
    error
  ) {
    console.error(
      'Exam Prep Discord sync:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not synchronize Discord access.',
      },
      {
        status:
          500,
      }
    )
  }
}