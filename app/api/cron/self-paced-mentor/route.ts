// app/api/cron/self-paced-mentor/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { Types } from 'mongoose'

import connectDB from '@/lib/mongodb'

import {
  determineMentorAction,
  getMentorEligibleEnrollments,
  recordMentorActionSent,
  syncMentorCourseContext,
  MentorDecision,
} from '@/lib/selfPacedMentor'

import {
  sendWhatsAppBodyTemplate,
} from '@/lib/whatsapp'

import SelfPacedMentorMessage from '@/models/SelfPacedMentorMessage'

// ============================================================
// ROUTE CONFIGURATION
// ============================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================
// TYPES
// ============================================================

interface CronResult {
  enrollmentId: string
  courseId?: string

  status:
    | 'sent'
    | 'skipped'
    | 'failed'

  action?: string
  reason?: string
  error?: string
}

interface CronSummary {
  success: boolean

  checked: number
  decisions: number

  sent: number
  skipped: number
  failed: number

  startedAt: string
  finishedAt: string

  results: CronResult[]
}

type MentorMessageType =
  | 'welcome'
  | 'study_reminder'
  | 'inactivity'
  | 'week_passed'
  | 'assessment_support'
  | 'feedback_request'
  | 'completion'

// ============================================================
// CONSTANTS
// ============================================================

const MAX_SENDS_PER_RUN = 50

// ============================================================
// CRON AUTHORIZATION
// ============================================================

function isAuthorizedCronRequest(
  request: NextRequest
): boolean {
  const cronSecret =
    process.env.CRON_SECRET

  if (!cronSecret) {
    console.error(
      '[SelfPacedMentorCron] CRON_SECRET is not configured.'
    )

    return false
  }

  const authorization =
    request.headers.get(
      'authorization'
    )

  if (!authorization) {
    return false
  }

  return (
    authorization ===
    `Bearer ${cronSecret}`
  )
}

// ============================================================
// ERROR HELPER
// ============================================================

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  if (
    typeof error === 'string'
  ) {
    return error
  }

  return 'Unknown error'
}

// ============================================================
// MESSAGE TYPE
// ============================================================

function getMessageType(
  action: MentorDecision['action']
): MentorMessageType {
  if (
    action ===
    'study_checkin'
  ) {
    return 'study_reminder'
  }

  return action
}

// ============================================================
// BUILD AUDIT MESSAGE
// ============================================================

function buildAuditMessage(
  decision: MentorDecision
): string {
  switch (
    decision.action
  ) {
    case 'welcome':
      return (
        `Welcome mentoring message for ` +
        `${decision.courseTitle}.`
      )

    case 'study_checkin':
      return (
        `Study check-in for ` +
        `${decision.courseTitle}, ` +
        `Week ${decision.currentWeek}.`
      )

    case 'inactivity':
      return (
        `Inactivity reminder for ` +
        `${decision.courseTitle}, ` +
        `Week ${decision.currentWeek}.`
      )

    case 'week_passed':
      return (
        `Week ${decision.currentWeek} ` +
        `completion encouragement for ` +
        `${decision.courseTitle}.`
      )

    case 'assessment_support':
      return (
        `Assessment support for ` +
        `${decision.courseTitle}, ` +
        `Week ${decision.currentWeek}.`
      )

    case 'feedback_request':
      return (
        `Course feedback request for ` +
        `${decision.courseTitle}.`
      )

    case 'completion':
      return (
        `Course completion message for ` +
        `${decision.courseTitle}.`
      )

    default:
      return (
        `Automated mentoring message for ` +
        `${decision.courseTitle}.`
      )
  }
}

// ============================================================
// MARK MESSAGE FAILED
// ============================================================

async function markMessageFailed(
  messageId: Types.ObjectId,
  errorMessage: string
): Promise<void> {
  await SelfPacedMentorMessage.updateOne(
    {
      _id:
        messageId,
    },
    {
      $set: {
        status:
          'failed',

        errorMessage,
      },
    }
  )
}

// ============================================================
// PROCESS ONE MENTOR DECISION
// ============================================================

async function processMentorDecision(
  decision: MentorDecision
): Promise<{
  success: boolean
  error?: string
}> {
  // ----------------------------------------------------------
  // CREATE QUEUED MESSAGE
  // ----------------------------------------------------------

  const messageRecord =
    await SelfPacedMentorMessage.create({
      selfPacedStudentId:
        decision.selfPacedStudentId,

      enrollmentId:
        decision.enrollmentId,

      courseId:
        decision.courseId,

      direction:
        'outbound',

      type:
        getMessageType(
          decision.action
        ),

      phone:
        decision.phone,

      message:
        buildAuditMessage(
          decision
        ),

      templateName:
        decision.templateName,

      status:
        'queued',

      metadata: {
        reason:
          decision.reason,

        templateValues:
          decision.templateValues,

        currentWeek:
          decision.currentWeek,

        ...decision.metadata,
      },
    })

  // ----------------------------------------------------------
  // SEND TO WHATSAPP
  // ----------------------------------------------------------

  try {
    const sendResult =
      await sendWhatsAppBodyTemplate({
        phone:
          decision.phone,

        templateName:
          decision.templateName,

        values:
          decision.templateValues,
      })

    // --------------------------------------------------------
    // WHATSAPP REJECTED MESSAGE
    // --------------------------------------------------------

    if (
      !sendResult.success
    ) {
      const errorMessage =
        sendResult.error ||
        'WhatsApp rejected the message.'

      await markMessageFailed(
        messageRecord._id,
        errorMessage
      )

      return {
        success: false,

        error:
          errorMessage,
      }
    }

    // --------------------------------------------------------
    // WHATSAPP ACCEPTED MESSAGE
    // --------------------------------------------------------

    const sentAt =
      new Date()

    const sentUpdate: {
      status: 'sent'
      sentAt: Date
      whatsappMessageId?: string
    } = {
      status:
        'sent',

      sentAt,
    }

    if (
      sendResult.messageId
    ) {
      sentUpdate.whatsappMessageId =
        sendResult.messageId
    }

    await SelfPacedMentorMessage.updateOne(
      {
        _id:
          messageRecord._id,
      },
      {
        $set:
          sentUpdate,

        $unset: {
          errorMessage: 1,
        },
      }
    )

    // --------------------------------------------------------
    // RECORD SUCCESSFUL MENTOR EVENT
    // --------------------------------------------------------

    await recordMentorActionSent(
      decision,
      sentAt
    )

    return {
      success: true,
    }
  } catch (error) {
    // --------------------------------------------------------
    // UNEXPECTED ERROR
    // --------------------------------------------------------

    const errorMessage =
      getErrorMessage(
        error
      )

    console.error(
      '[SelfPacedMentorCron] WhatsApp send failed:',
      {
        enrollmentId:
          decision.enrollmentId,

        courseId:
          decision.courseId,

        action:
          decision.action,

        error:
          errorMessage,
      }
    )

    try {
      await markMessageFailed(
        messageRecord._id,
        errorMessage
      )
    } catch (
      updateError
    ) {
      console.error(
        '[SelfPacedMentorCron] Could not mark message as failed:',
        updateError
      )
    }

    return {
      success: false,

      error:
        errorMessage,
    }
  }
}

// ============================================================
// RUN MENTOR CRON
// ============================================================

async function runMentorCron(): Promise<CronSummary> {
  const startedAt =
    new Date()

  await connectDB()

  const enrollments =
    await getMentorEligibleEnrollments()

  const results:
    CronResult[] = []

  let decisions = 0
  let sent = 0
  let skipped = 0
  let failed = 0

  // ----------------------------------------------------------
  // PROCESS EACH ENROLLMENT
  // ----------------------------------------------------------

  for (
    const enrollment of
    enrollments
  ) {
    const enrollmentId =
      enrollment._id.toString()

    const courseId =
      enrollment.courseId
        ?.toString()

    try {
      // ------------------------------------------------------
      // SEND LIMIT
      // ------------------------------------------------------

      if (
        sent >=
        MAX_SENDS_PER_RUN
      ) {
        skipped += 1

        results.push({
          enrollmentId,
          courseId,

          status:
            'skipped',

          reason:
            'Cron send limit reached for this run.',
        })

        continue
      }

      // ------------------------------------------------------
      // DETERMINE ACTION
      // ------------------------------------------------------

      const evaluation =
        await determineMentorAction(
          enrollmentId,
          new Date()
        )

      // ------------------------------------------------------
      // NOTHING TO SEND
      // ------------------------------------------------------

      if (
        !evaluation.decision
      ) {
        skipped += 1

        results.push({
          enrollmentId,
          courseId,

          status:
            'skipped',

          reason:
            evaluation.reason ||
            'No mentor action required.',
        })

        // ----------------------------------------------------
        // UPDATE OBSERVED COURSE CONTEXT
        // ----------------------------------------------------

        try {
          await syncMentorCourseContext(
            enrollmentId
          )
        } catch (
          syncError
        ) {
          console.error(
            '[SelfPacedMentorCron] Failed to sync mentor context:',
            {
              enrollmentId,

              error:
                getErrorMessage(
                  syncError
                ),
            }
          )
        }

        continue
      }

      // ------------------------------------------------------
      // DECISION FOUND
      // ------------------------------------------------------

      decisions += 1

      const decision =
        evaluation.decision

      // ------------------------------------------------------
      // PROCESS MESSAGE
      // ------------------------------------------------------

      const sendResult =
        await processMentorDecision(
          decision
        )

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      if (
        sendResult.success
      ) {
        sent += 1

        results.push({
          enrollmentId,
          courseId,

          status:
            'sent',

          action:
            decision.action,

          reason:
            decision.reason,
        })

        continue
      }

      // ------------------------------------------------------
      // FAILED SEND
      // ------------------------------------------------------

      failed += 1

      results.push({
        enrollmentId,
        courseId,

        status:
          'failed',

        action:
          decision.action,

        reason:
          decision.reason,

        error:
          sendResult.error,
      })
    } catch (error) {
      // ------------------------------------------------------
      // ENROLLMENT PROCESSING ERROR
      // ------------------------------------------------------

      failed += 1

      const errorMessage =
        getErrorMessage(
          error
        )

      console.error(
        '[SelfPacedMentorCron] Enrollment processing failed:',
        {
          enrollmentId,
          courseId,

          error:
            errorMessage,
        }
      )

      results.push({
        enrollmentId,
        courseId,

        status:
          'failed',

        error:
          errorMessage,
      })
    }
  }

  // ----------------------------------------------------------
  // FINISH
  // ----------------------------------------------------------

  const finishedAt =
    new Date()

  return {
    success:
      failed === 0,

    checked:
      enrollments.length,

    decisions,

    sent,
    skipped,
    failed,

    startedAt:
      startedAt.toISOString(),

    finishedAt:
      finishedAt.toISOString(),

    results,
  }
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request: NextRequest
) {
  // ----------------------------------------------------------
  // AUTHORIZE CRON
  // ----------------------------------------------------------

  if (
    !isAuthorizedCronRequest(
      request
    )
  ) {
    return NextResponse.json(
      {
        error:
          'Unauthorized',
      },
      {
        status: 401,
      }
    )
  }

  // ----------------------------------------------------------
  // RUN
  // ----------------------------------------------------------

  try {
    const summary =
      await runMentorCron()

    return NextResponse.json(
      summary,
      {
        status:
          summary.failed > 0
            ? 207
            : 200,
      }
    )
  } catch (error) {
    const errorMessage =
      getErrorMessage(
        error
      )

    console.error(
      '[SelfPacedMentorCron] Cron failed:',
      error
    )

    return NextResponse.json(
      {
        success: false,

        error:
          'Self-paced mentor cron failed.',

        details:
          errorMessage,
      },
      {
        status: 500,
      }
    )
  }
}