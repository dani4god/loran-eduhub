// app/api/whatsapp/webhook/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import crypto from 'crypto'
import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'

import {
  normalizeWhatsAppPhone,
  sendWhatsAppText,
} from '@/lib/whatsapp'

import {
  generateSelfPacedMentorReply,
} from '@/lib/selfPacedMentorAI'

import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedMentorPreference from '@/models/SelfPacedMentorPreference'
import SelfPacedMentorState from '@/models/SelfPacedMentorState'
import SelfPacedMentorMessage from '@/models/SelfPacedMentorMessage'
import SelfPacedMentorEscalation from '@/models/SelfPacedMentorEscalation'

// ============================================================
// TYPES
// ============================================================

interface WhatsAppContact {
  profile?: {
    name?: string
  }

  wa_id?: string
}

interface WhatsAppText {
  body?: string
}

interface WhatsAppButton {
  text?: string
  payload?: string
}

interface WhatsAppInteractive {
  type?: string

  button_reply?: {
    id?: string
    title?: string
  }

  list_reply?: {
    id?: string
    title?: string
    description?: string
  }
}

interface WhatsAppInboundMessage {
  from?: string
  id?: string
  timestamp?: string

  type?: string

  text?: WhatsAppText
  button?: WhatsAppButton
  interactive?: WhatsAppInteractive
}

interface WhatsAppStatus {
  id?: string

  status?:
    | 'sent'
    | 'delivered'
    | 'read'
    | 'failed'

  timestamp?: string

  recipient_id?: string

  errors?: Array<{
    code?: number
    title?: string
    message?: string

    error_data?: {
      details?: string
    }
  }>
}

interface WhatsAppMetadata {
  display_phone_number?: string
  phone_number_id?: string
}

interface WhatsAppValue {
  messaging_product?: string

  metadata?: WhatsAppMetadata

  contacts?: WhatsAppContact[]

  messages?: WhatsAppInboundMessage[]

  statuses?: WhatsAppStatus[]
}

interface WhatsAppChange {
  value?: WhatsAppValue
  field?: string
}

interface WhatsAppEntry {
  id?: string
  changes?: WhatsAppChange[]
}

interface WhatsAppWebhookPayload {
  object?: string
  entry?: WhatsAppEntry[]
}

interface ActiveEnrollmentOption {
  enrollmentId:
    mongoose.Types.ObjectId

  courseId:
    mongoose.Types.ObjectId

  courseTitle: string
}

interface CourseContext {
  enrollmentId:
    mongoose.Types.ObjectId

  courseId:
    mongoose.Types.ObjectId

  state:
    InstanceType<
      typeof SelfPacedMentorState
    > | null
}

// ============================================================
// WEBHOOK VERIFICATION
// ============================================================

export async function GET(
  request: NextRequest
) {
  const mode =
    request.nextUrl
      .searchParams
      .get('hub.mode')

  const token =
    request.nextUrl
      .searchParams
      .get('hub.verify_token')

  const challenge =
    request.nextUrl
      .searchParams
      .get('hub.challenge')

  const expectedToken =
    process.env
      .WHATSAPP_VERIFY_TOKEN

  if (!expectedToken) {
    console.error(
      'WHATSAPP_VERIFY_TOKEN is not configured.'
    )

    return new NextResponse(
      'Webhook verification is not configured.',
      {
        status: 500,
      }
    )
  }

  if (
    mode === 'subscribe' &&
    token === expectedToken &&
    challenge
  ) {
    return new NextResponse(
      challenge,
      {
        status: 200,

        headers: {
          'Content-Type':
            'text/plain; charset=utf-8',
        },
      }
    )
  }

  return new NextResponse(
    'Webhook verification failed.',
    {
      status: 403,
    }
  )
}

// ============================================================
// SIGNATURE VERIFICATION
// ============================================================

function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const appSecret =
    process.env
      .WHATSAPP_APP_SECRET

  if (!appSecret) {
    console.error(
      'WHATSAPP_APP_SECRET is not configured.'
    )

    return false
  }

  if (!signatureHeader) {
    return false
  }

  const prefix =
    'sha256='

  if (
    !signatureHeader.startsWith(
      prefix
    )
  ) {
    return false
  }

  const suppliedSignature =
    signatureHeader.slice(
      prefix.length
    )

  if (
    !/^[a-fA-F0-9]{64}$/.test(
      suppliedSignature
    )
  ) {
    return false
  }

  const expectedSignature =
    crypto
      .createHmac(
        'sha256',
        appSecret
      )
      .update(
        rawBody,
        'utf8'
      )
      .digest('hex')

  try {
    const suppliedBuffer =
      Buffer.from(
        suppliedSignature,
        'hex'
      )

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        'hex'
      )

    if (
      suppliedBuffer.length !==
      expectedBuffer.length
    ) {
      return false
    }

    return crypto
      .timingSafeEqual(
        suppliedBuffer,
        expectedBuffer
      )
  } catch {
    return false
  }
}

// ============================================================
// TIMESTAMP HELPER
// ============================================================

function whatsappTimestampToDate(
  timestamp?: string
): Date {
  if (!timestamp) {
    return new Date()
  }

  const seconds =
    Number(timestamp)

  if (
    !Number.isFinite(
      seconds
    )
  ) {
    return new Date()
  }

  return new Date(
    seconds * 1000
  )
}

// ============================================================
// EXTRACT INBOUND TEXT
// ============================================================

function extractMessageText(
  message:
    WhatsAppInboundMessage
): string | null {
  if (
    message.type ===
      'text' &&
    message.text?.body
  ) {
    return message.text.body.trim()
  }

  if (
    message.type ===
    'button'
  ) {
    return (
      message.button?.text
        ?.trim() ||
      message.button?.payload
        ?.trim() ||
      null
    )
  }

  if (
    message.type ===
    'interactive'
  ) {
    if (
      message.interactive
        ?.button_reply
        ?.title
    ) {
      return message
        .interactive
        .button_reply
        .title
        .trim()
    }

    if (
      message.interactive
        ?.list_reply
        ?.title
    ) {
      return message
        .interactive
        .list_reply
        .title
        .trim()
    }
  }

  return null
}

// ============================================================
// HANDLE MESSAGE STATUS
// ============================================================

async function handleMessageStatus(
  status: WhatsAppStatus
) {
  if (
    !status.id ||
    !status.status
  ) {
    return
  }

  const update:
    Record<
      string,
      unknown
    > = {
      status:
        status.status,
    }

  const eventDate =
    whatsappTimestampToDate(
      status.timestamp
    )

  if (
    status.status ===
    'sent'
  ) {
    update.sentAt =
      eventDate
  }

  if (
    status.status ===
    'delivered'
  ) {
    update.deliveredAt =
      eventDate
  }

  if (
    status.status ===
    'read'
  ) {
    update.readAt =
      eventDate
  }

  if (
    status.status ===
    'failed'
  ) {
    const error =
      status.errors?.[0]

    update.errorMessage =
      error?.error_data
        ?.details ||
      error?.message ||
      error?.title ||
      'WhatsApp message failed.'
  }

  await SelfPacedMentorMessage
    .findOneAndUpdate(
      {
        whatsappMessageId:
          status.id,
      },

      {
        $set:
          update,
      }
    )
}

// ============================================================
// ACTIVE ENROLLMENT OPTIONS
// ============================================================

async function getActiveEnrollmentOptions(
  selfPacedStudentId:
    mongoose.Types.ObjectId
): Promise<
  ActiveEnrollmentOption[]
> {
  const enrollments =
    await SelfPacedEnrollment
      .find({
        selfPacedStudentId,

        completedAt: {
          $exists: false,
        },
      })
      .select(
        '_id courseId lastActivityAt updatedAt'
      )
      .sort({
        lastActivityAt: -1,
        updatedAt: -1,
      })
      .lean()

  if (
    enrollments.length ===
    0
  ) {
    return []
  }

  const courseIds =
    enrollments.map(
      (enrollment) =>
        enrollment.courseId
    )

  const courses =
    await SelfPacedCourse
      .find({
        _id: {
          $in:
            courseIds,
        },
      })
      .select(
        '_id title'
      )
      .lean()

  const courseTitleMap =
    new Map<
      string,
      string
    >()

  for (
    const course of
    courses
  ) {
    courseTitleMap.set(
      course._id.toString(),
      course.title
    )
  }

  return enrollments
    .map(
      (
        enrollment
      ):
        ActiveEnrollmentOption |
        null => {
        const courseTitle =
          courseTitleMap.get(
            enrollment
              .courseId
              .toString()
          )

        if (!courseTitle) {
          return null
        }

        return {
          enrollmentId:
            enrollment._id,

          courseId:
            enrollment.courseId,

          courseTitle,
        }
      }
    )
    .filter(
      (
        option
      ): option is
        ActiveEnrollmentOption =>
        option !== null
    )
}

// ============================================================
// VALIDATE SAVED COURSE CONTEXT
// ============================================================

async function getSavedCourseContext(
  preference:
    InstanceType<
      typeof SelfPacedMentorPreference
    >
): Promise<
  CourseContext | null
> {
  if (
    !preference
      .activeEnrollmentId ||
    !preference
      .activeCourseId
  ) {
    return null
  }

  const enrollment =
    await SelfPacedEnrollment
      .findOne({
        _id:
          preference
            .activeEnrollmentId,

        selfPacedStudentId:
          preference
            .selfPacedStudentId,

        courseId:
          preference
            .activeCourseId,

        completedAt: {
          $exists: false,
        },
      })
      .select(
        '_id courseId'
      )
      .lean()

  if (!enrollment) {
    preference
      .activeEnrollmentId =
      undefined

    preference
      .activeCourseId =
      undefined

    preference
      .contextSelectedAt =
      undefined

    preference
      .awaitingCourseSelection =
      false

    await preference.save()

    return null
  }

  const state =
    await SelfPacedMentorState
      .findOne({
        selfPacedStudentId:
          preference
            .selfPacedStudentId,

        enrollmentId:
          enrollment._id,

        courseId:
          enrollment.courseId,

        status:
          'active',
      })

  return {
    enrollmentId:
      enrollment._id,

    courseId:
      enrollment.courseId,

    state,
  }
}

// ============================================================
// SAVE OUTBOUND MESSAGE
// ============================================================

async function saveOutboundMessage({
  selfPacedStudentId,
  enrollmentId,
  courseId,
  phone,
  message,
  whatsappMessageId,
  status,
  errorMessage,
  metadata,
}: {
  selfPacedStudentId:
    mongoose.Types.ObjectId

  enrollmentId?:
    mongoose.Types.ObjectId

  courseId?:
    mongoose.Types.ObjectId

  phone: string

  message: string

  whatsappMessageId?: string

  status:
    | 'sent'
    | 'failed'

  errorMessage?: string

  metadata?:
    Record<
      string,
      unknown
    >
}) {
  const now =
    new Date()

  return SelfPacedMentorMessage
    .create({
      selfPacedStudentId,

      enrollmentId,

      courseId,

      direction:
        'outbound',

      type:
        'ai_reply',

      phone,

      message,

      whatsappMessageId,

      status,

      errorMessage,

      metadata,

      sentAt:
        status === 'sent'
          ? now
          : undefined,
    })
}

// ============================================================
// SEND AND LOG TEXT
// ============================================================

async function sendAndLogText({
  selfPacedStudentId,
  enrollmentId,
  courseId,
  phone,
  message,
  metadata,
}: {
  selfPacedStudentId:
    mongoose.Types.ObjectId

  enrollmentId?:
    mongoose.Types.ObjectId

  courseId?:
    mongoose.Types.ObjectId

  phone: string

  message: string

  metadata?:
    Record<
      string,
      unknown
    >
}) {
  const result =
    await sendWhatsAppText(
      phone,
      message
    )

  if (result.success) {
    await saveOutboundMessage({
      selfPacedStudentId,

      enrollmentId,

      courseId,

      phone,

      message,

      whatsappMessageId:
        result.messageId,

      status:
        'sent',

      metadata,
    })

    return result
  }

  await saveOutboundMessage({
    selfPacedStudentId,

    enrollmentId,

    courseId,

    phone,

    message,

    status:
      'failed',

    errorMessage:
      result.error ||
      'WhatsApp send failed.',

    metadata,
  })

  return result
}

// ============================================================
// REQUEST COURSE SELECTION
// ============================================================

async function requestCourseSelection({
  studentId,
  firstName,
  phone,
  preference,
  options,
}: {
  studentId:
    mongoose.Types.ObjectId

  firstName: string

  phone: string

  preference:
    InstanceType<
      typeof SelfPacedMentorPreference
    >

  options:
    ActiveEnrollmentOption[]
}) {
  preference
    .awaitingCourseSelection =
    true

  preference
    .activeEnrollmentId =
    undefined

  preference
    .activeCourseId =
    undefined

  preference
    .contextSelectedAt =
    undefined

  await preference.save()

  const lines =
    options.map(
      (
        option,
        index
      ) =>
        `${index + 1}. ${option.courseTitle}`
    )

  const message =
    [
      `Hi ${firstName} 👋`,
      '',
      'You are currently enrolled in more than one self-paced course.',
      '',
      'Which course would you like help with?',
      '',
      ...lines,
      '',
      'Reply with the number of the course, for example: 1',
    ].join('\n')

  const result =
    await sendAndLogText({
      selfPacedStudentId:
        studentId,

      phone,

      message,

      metadata: {
        purpose:
          'course_selection',

        optionCount:
          options.length,

        options:
          options.map(
            (
              option,
              index
            ) => ({
              number:
                index + 1,

              enrollmentId:
                option
                  .enrollmentId
                  .toString(),

              courseId:
                option
                  .courseId
                  .toString(),

              courseTitle:
                option
                  .courseTitle,
            })
          ),
      },
    })

  if (!result.success) {
    console.error(
      'Failed to send WhatsApp course selection:',
      result.error
    )
  }
}

// ============================================================
// PARSE COURSE SELECTION
// ============================================================

function parseCourseSelection(
  messageText: string,
  optionCount: number
): number | null {
  const cleaned =
    messageText
      .trim()
      .toLowerCase()

  const directNumber =
    Number(cleaned)

  if (
    Number.isInteger(
      directNumber
    ) &&
    directNumber >= 1 &&
    directNumber <=
      optionCount
  ) {
    return (
      directNumber - 1
    )
  }

  const match =
    cleaned.match(
      /\b(\d+)\b/
    )

  if (!match) {
    return null
  }

  const number =
    Number(match[1])

  if (
    !Number.isInteger(
      number
    ) ||
    number < 1 ||
    number > optionCount
  ) {
    return null
  }

  return number - 1
}

// ============================================================
// HANDLE COURSE SELECTION RESPONSE
// ============================================================

async function handleCourseSelectionResponse({
  studentId,
  firstName,
  phone,
  messageText,
  preference,
  options,
}: {
  studentId:
    mongoose.Types.ObjectId

  firstName: string

  phone: string

  messageText: string

  preference:
    InstanceType<
      typeof SelfPacedMentorPreference
    >

  options:
    ActiveEnrollmentOption[]
}) {
  /*
   * The options are re-read from active enrollments before this
   * function is called. Later, this can be upgraded to persist
   * the exact option mapping or use interactive reply IDs.
   */
  if (
    options.length === 0
  ) {
    preference
      .awaitingCourseSelection =
      false

    await preference.save()

    const result =
      await sendAndLogText({
        selfPacedStudentId:
          studentId,

        phone,

        message:
          'I could not find an active self-paced course on your account. Please check your Loran EduHub enrollments.',

        metadata: {
          purpose:
            'no_active_course',
        },
      })

    if (!result.success) {
      console.error(
        'Failed to send no-active-course message:',
        result.error
      )
    }

    return
  }

  const selectedIndex =
    parseCourseSelection(
      messageText,
      options.length
    )

  if (
    selectedIndex === null
  ) {
    await requestCourseSelection({
      studentId,
      firstName,
      phone,
      preference,
      options,
    })

    return
  }

  const selected =
    options[
      selectedIndex
    ]

  preference
    .activeEnrollmentId =
    selected.enrollmentId

  preference
    .activeCourseId =
    selected.courseId

  preference
    .contextSelectedAt =
    new Date()

  preference
    .awaitingCourseSelection =
    false

  await preference.save()

  const state =
    await SelfPacedMentorState
      .findOne({
        selfPacedStudentId:
          studentId,

        enrollmentId:
          selected
            .enrollmentId,

        courseId:
          selected
            .courseId,

        status:
          'active',
      })

  const context:
    CourseContext = {
      enrollmentId:
        selected
          .enrollmentId,

      courseId:
        selected
          .courseId,

      state,
    }

  const confirmation =
    [
      `Great, ${firstName}.`,
      '',
      `We'll continue with ${selected.courseTitle}.`,
      '',
      'What would you like help with?',
    ].join('\n')

  const result =
    await sendAndLogText({
      selfPacedStudentId:
        studentId,

      enrollmentId:
        context
          .enrollmentId,

      courseId:
        context
          .courseId,

      phone,

      message:
        confirmation,

      metadata: {
        purpose:
          'course_selected',

        courseTitle:
          selected
            .courseTitle,
      },
    })

  if (!result.success) {
    console.error(
      'Failed to send WhatsApp course selection confirmation:',
      result.error
    )
  }
}

// ============================================================
// SAVE INBOUND MESSAGE
// ============================================================

async function saveInboundMessage({
  studentId,
  context,
  phone,
  messageText,
  message,
}: {
  studentId:
    mongoose.Types.ObjectId

  context:
    CourseContext | null

  phone: string

  messageText: string

  message:
    WhatsAppInboundMessage
}) {
  if (!message.id) {
    return null
  }

  /*
   * Meta can retry webhook events.
   * whatsappMessageId is unique/sparse in the message model,
   * but checking first also prevents us from generating a second
   * mentor response for a webhook retry.
   */
  const existing =
    await SelfPacedMentorMessage
      .findOne({
        whatsappMessageId:
          message.id,
      })
      .select('_id')
      .lean()

  if (existing) {
    return null
  }

  const receivedAt =
    whatsappTimestampToDate(
      message.timestamp
    )

  try {
    const savedMessage =
      await SelfPacedMentorMessage
        .create({
          selfPacedStudentId:
            studentId,

          enrollmentId:
            context
              ?.enrollmentId,

          courseId:
            context
              ?.courseId,

          direction:
            'inbound',

          type:
            'student_reply',

          phone,

          message:
            messageText,

          whatsappMessageId:
            message.id,

          status:
            'received',

          receivedAt,

          metadata: {
            whatsappType:
              message.type,

            contextResolved:
              Boolean(
                context
              ),
          },
        })

    return {
      savedMessage,
      receivedAt,
    }
  } catch (
    error: unknown
  ) {
    /*
     * A concurrent webhook retry can still race between the
     * existence check and create(). If the unique message ID
     * wins in another request, treat this one as already handled.
     */
    if (
      error &&
      typeof error ===
        'object' &&
      'code' in error &&
      (
        error as {
          code?: number
        }
      ).code === 11000
    ) {
      return null
    }

    throw error
  }
}

// ============================================================
// HUMAN SUPPORT / OPT-OUT HELPERS
// ============================================================

function normalizeCommandText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(
      /[^\w\s]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function isOptOutRequest(
  messageText: string
): boolean {
  const value =
    normalizeCommandText(
      messageText
    )

  return [
    'stop',
    'unsubscribe',
    'cancel',
    'opt out',
    'optout',
  ].includes(value)
}

function isHumanSupportRequest(
  messageText: string
): boolean {
  const value =
    normalizeCommandText(
      messageText
    )

  const phrases = [
    'human',
    'agent',
    'support',
    'human support',
    'customer support',
    'talk to a human',
    'talk to human',
    'speak to a human',
    'speak to human',
    'talk to an agent',
    'speak to an agent',
    'real person',
    'someone from support',
  ]

  return phrases.some(
    (phrase) =>
      value === phrase ||
      value.includes(
        phrase
      )
  )
}
// ============================================================
// CREATE HUMAN ESCALATION
// ============================================================

async function createHumanEscalation({
  studentId,
  context,
  sourceMessageId,
  phone,
  studentMessage,
  reason,
  aiSummary,
}: {
  studentId:
    mongoose.Types.ObjectId

  context:
    CourseContext | null

  sourceMessageId?:
    mongoose.Types.ObjectId

  phone: string

  studentMessage: string

  reason:
    | 'student_requested_human'
    | 'ai_cannot_answer'
    | 'account_issue'
    | 'payment_issue'
    | 'technical_issue'
    | 'course_access_issue'
    | 'other'

  aiSummary?: string
}) {
  /*
   * Do not create several open support requests for the same
   * student/course while an earlier one is still waiting for
   * human attention.
   */
  const existing =
    await SelfPacedMentorEscalation
      .findOne({
        selfPacedStudentId:
          studentId,

        enrollmentId:
          context?.enrollmentId,

        courseId:
          context?.courseId,

        status: {
          $in: [
            'open',
            'in_progress',
          ],
        },
      })
      .sort({
        createdAt: -1,
      })

  if (existing) {
    return existing
  }

  return SelfPacedMentorEscalation
    .create({
      selfPacedStudentId:
        studentId,

      enrollmentId:
        context?.enrollmentId,

      courseId:
        context?.courseId,

      sourceMessageId,

      phone,

      studentMessage,

      reason,

      aiSummary,

      status:
        'open',
    })
}

// ============================================================
// SEND HUMAN ESCALATION CONFIRMATION
// ============================================================

async function sendHumanEscalationConfirmation({
  studentId,
  firstName,
  phone,
  context,
  sourceMessageId,
  studentMessage,
  reason,
  aiSummary,
}: {
  studentId:
    mongoose.Types.ObjectId

  firstName: string

  phone: string

  context:
    CourseContext | null

  sourceMessageId?:
    mongoose.Types.ObjectId

  studentMessage: string

  reason:
    | 'student_requested_human'
    | 'ai_cannot_answer'
    | 'account_issue'
    | 'payment_issue'
    | 'technical_issue'
    | 'course_access_issue'
    | 'other'

  aiSummary?: string
}) {
  const escalation =
    await createHumanEscalation({
      studentId,

      context,

      sourceMessageId,

      phone,

      studentMessage,

      reason,

      aiSummary,
    })

  const message =
    [
      `Thanks, ${firstName}.`,
      '',
      'I have referred your message to the Loran EduHub support team for human assistance.',
      '',
      'A member of the team can review your request and continue with you here on WhatsApp. You do not need to repeat your question.',
    ].join('\n')

  const result =
    await sendAndLogText({
      selfPacedStudentId:
        studentId,

      enrollmentId:
        context?.enrollmentId,

      courseId:
        context?.courseId,

      phone,

      message,

      metadata: {
        purpose:
          'human_escalation_confirmation',

        escalationId:
          escalation._id.toString(),

        escalationReason:
          reason,
      },
    })

  if (!result.success) {
    console.error(
      'Human escalation was created but WhatsApp confirmation failed:',
      result.error
    )
  }
}

// ============================================================
// GENERATE AND SEND AI MENTOR RESPONSE
// ============================================================

async function sendAIMentorResponse({
  studentId,
  firstName,
  phone,
  messageText,
  context,
  sourceMessageId,
}: {
  studentId:
    mongoose.Types.ObjectId

  firstName: string

  phone: string

  messageText: string

  context:
    CourseContext

  sourceMessageId?:
    mongoose.Types.ObjectId
}) {
  try {
    const mentorResult =
      await generateSelfPacedMentorReply({
        selfPacedStudentId:
          studentId,

        enrollmentId:
          context.enrollmentId,

        courseId:
          context.courseId,

        firstName,

        studentMessage:
          messageText,
      })

    // ========================================================
    // AI DECIDED HUMAN SUPPORT IS REQUIRED
    // ========================================================

    if (
      mentorResult.escalate
    ) {
      await sendHumanEscalationConfirmation({
        studentId,

        firstName,

        phone,

        context,

        sourceMessageId,

        studentMessage:
          messageText,

        reason:
          mentorResult.reason ||
          'ai_cannot_answer',

        aiSummary:
          mentorResult
            .escalationSummary,
      })

      return
    }

    // ========================================================
    // NORMAL AI RESPONSE
    // ========================================================

    const result =
      await sendAndLogText({
        selfPacedStudentId:
          studentId,

        enrollmentId:
          context.enrollmentId,

        courseId:
          context.courseId,

        phone,

        message:
          mentorResult.reply,

        metadata: {
          purpose:
            'ai_mentor_reply',

          provider:
            'groq',
        },
      })

    if (!result.success) {
      console.error(
        'AI mentor response generated but WhatsApp delivery request failed:',
        result.error
      )
    }
  } catch (
    error
  ) {
    console.error(
      'WhatsApp mentor AI error:',
      error
    )

    /*
     * If Groq or the mentor engine itself fails, do not leave the
     * student at a dead end.
     *
     * Preserve the request for human attention.
     */
    try {
      await sendHumanEscalationConfirmation({
        studentId,

        firstName,

        phone,

        context,

        sourceMessageId,

        studentMessage:
          messageText,

        reason:
          'ai_cannot_answer',

        aiSummary:
          'The automated WhatsApp mentor could not generate a response. Review the student message and assist manually.',
      })
    } catch (
      escalationError
    ) {
      console.error(
        'AI mentor failed and human escalation also failed:',
        escalationError
      )

      /*
       * This is the final fallback only when BOTH the AI response
       * and escalation creation/confirmation fail.
       */
      const fallbackMessage =
        [
          `Thanks, ${firstName}.`,
          '',
          'I received your message, but the mentor service is temporarily unavailable.',
          '',
          'Please try again shortly or contact the Loran EduHub support team.',
        ].join('\n')

      const fallbackResult =
        await sendAndLogText({
          selfPacedStudentId:
            studentId,

          enrollmentId:
            context.enrollmentId,

          courseId:
            context.courseId,

          phone,

          message:
            fallbackMessage,

          metadata: {
            purpose:
              'ai_mentor_fallback',
          },
        })

      if (
        !fallbackResult.success
      ) {
        console.error(
          'WhatsApp mentor fallback message also failed:',
          fallbackResult.error
        )
      }
    }
  }
}

// ============================================================
// HANDLE INBOUND MESSAGE
// ============================================================

async function handleInboundMessage(
  message:
    WhatsAppInboundMessage
) {
  if (
    !message.id ||
    !message.from
  ) {
    return
  }

  const messageText =
    extractMessageText(
      message
    )

  if (!messageText) {
    console.warn(
      'Unsupported or empty WhatsApp message type:',
      message.type
    )

    return
  }

  const phone =
    normalizeWhatsAppPhone(
      message.from
    )

  if (!phone) {
    console.warn(
      'Could not normalize inbound WhatsApp phone:',
      message.from
    )

    return
  }

  // ==========================================================
  // DUPLICATE CHECK
  // ==========================================================

  /*
   * Check before doing any other work because Meta may retry
   * delivery of the same webhook event.
   */
  const duplicate =
    await SelfPacedMentorMessage
      .findOne({
        whatsappMessageId:
          message.id,
      })
      .select('_id')
      .lean()

  if (duplicate) {
    return
  }

  // ==========================================================
  // FIND MENTOR PREFERENCE BY WHATSAPP NUMBER
  // ==========================================================

  const preference =
    await SelfPacedMentorPreference
      .findOne({
        whatsappPhone:
          phone,
      })

  if (!preference) {
    console.warn(
      'No WhatsApp mentor preference found for inbound phone:',
      phone
    )

    return
  }

  // ==========================================================
  // OPT OUT
  // ==========================================================

  /*
   * STOP must be processed before checking enabled/consent.
   *
   * This means a student can still send STOP even if their
   * preference state is inconsistent or already disabled.
   */
  if (
    isOptOutRequest(
      messageText
    )
  ) {
    const student =
      await SelfPacedStudent
        .findById(
          preference
            .selfPacedStudentId
        )
        .select(
          '_id firstName'
        )
        .lean()

    if (!student) {
      console.warn(
        'Mentor preference points to a missing self-paced student.'
      )

      return
    }

    /*
     * Save the inbound STOP before responding so webhook retries
     * do not send multiple opt-out confirmations.
     */
    const inbound =
      await saveInboundMessage({
        studentId:
          student._id,

        context:
          null,

        phone,

        messageText,

        message,
      })

    if (!inbound) {
      return
    }

    preference.enabled =
      false

    preference
      .awaitingCourseSelection =
      false

    await preference.save()

    const result =
      await sendAndLogText({
        selfPacedStudentId:
          student._id,

        phone,

        message:
          'WhatsApp mentoring has been turned off for your Loran EduHub account. You can enable it again from your Mentor Settings page.',

        metadata: {
          purpose:
            'mentor_opt_out',
        },
      })

    if (!result.success) {
      console.error(
        'Failed to send mentor opt-out confirmation:',
        result.error
      )
    }

    return
  }

  // ==========================================================
  // CHECK MENTOR ACCESS
  // ==========================================================

  if (
    !preference.enabled ||
    !preference.consentGiven
  ) {
    console.warn(
      'WhatsApp message received for a disabled or non-consented mentor preference.'
    )

    return
  }

  // ==========================================================
  // FIND STUDENT
  // ==========================================================

  const student =
    await SelfPacedStudent
      .findById(
        preference
          .selfPacedStudentId
      )
      .select(
        '_id firstName lastName'
      )
      .lean()

  if (!student) {
    console.warn(
      'Mentor preference points to a missing self-paced student.'
    )

    return
  }

  const studentId =
    student._id

  const firstName =
    student.firstName ||
    'there'

  // ==========================================================
  // UPDATE LAST REPLY INFORMATION
  // ==========================================================

  preference
    .lastStudentReplyAt =
    whatsappTimestampToDate(
      message.timestamp
    )

  preference
    .lastInboundPhone =
    phone

  await preference.save()

  // ==========================================================
  // GET ACTIVE ENROLLMENTS
  // ==========================================================

  const activeOptions =
    await getActiveEnrollmentOptions(
      studentId
    )

  // ==========================================================
  // NO ACTIVE COURSE
  // ==========================================================

  if (
    activeOptions.length ===
    0
  ) {
    const inbound =
      await saveInboundMessage({
        studentId,

        context:
          null,

        phone,

        messageText,

        message,
      })

    if (!inbound) {
      return
    }

    /*
     * A human request should still work even if the student has
     * no active course. Human support may need to investigate an
     * enrollment/account problem.
     */
    if (
      isHumanSupportRequest(
        messageText
      )
    ) {
      await sendHumanEscalationConfirmation({
        studentId,

        firstName,

        phone,

        context:
          null,

        sourceMessageId:
          inbound
            .savedMessage
            ._id,

        studentMessage:
          messageText,

        reason:
          'student_requested_human',
      })

      return
    }

    const result =
      await sendAndLogText({
        selfPacedStudentId:
          studentId,

        phone,

        message:
          'I could not find an active self-paced course on your account. If you believe this is incorrect, reply "human" and I will refer your request to the Loran EduHub support team.',

        metadata: {
          purpose:
            'no_active_course',
        },
      })

    if (!result.success) {
      console.error(
        'Failed to send no-active-course response:',
        result.error
      )
    }

    return
  }

  // ==========================================================
  // WAITING FOR COURSE SELECTION
  // ==========================================================

  if (
    preference
      .awaitingCourseSelection
  ) {
    /*
     * Human support commands should work even while the bot is
     * waiting for the student to choose a course.
     */
    if (
      isHumanSupportRequest(
        messageText
      )
    ) {
      const inbound =
        await saveInboundMessage({
          studentId,

          context:
            null,

          phone,

          messageText,

          message,
        })

      if (!inbound) {
        return
      }

      preference
        .awaitingCourseSelection =
        false

      await preference.save()

      await sendHumanEscalationConfirmation({
        studentId,

        firstName,

        phone,

        context:
          null,

        sourceMessageId:
          inbound
            .savedMessage
            ._id,

        studentMessage:
          messageText,

        reason:
          'student_requested_human',
      })

      return
    }

    const inbound =
      await saveInboundMessage({
        studentId,

        context:
          null,

        phone,

        messageText,

        message,
      })

    if (!inbound) {
      return
    }

    await handleCourseSelectionResponse({
      studentId,

      firstName,

      phone,

      messageText,

      preference,

      options:
        activeOptions,
    })

    return
  }

  // ==========================================================
  // TRY SAVED CONTEXT
  // ==========================================================

  let context =
    await getSavedCourseContext(
      preference
    )

  // ==========================================================
  // SAVED CONTEXT DOES NOT EXIST
  // ==========================================================

  if (!context) {
    /*
     * A human request does not require course selection first.
     */
    if (
      isHumanSupportRequest(
        messageText
      )
    ) {
      const inbound =
        await saveInboundMessage({
          studentId,

          context:
            null,

          phone,

          messageText,

          message,
        })

      if (!inbound) {
        return
      }

      await sendHumanEscalationConfirmation({
        studentId,

        firstName,

        phone,

        context:
          null,

        sourceMessageId:
          inbound
            .savedMessage
            ._id,

        studentMessage:
          messageText,

        reason:
          'student_requested_human',
      })

      return
    }

    // ========================================================
    // ONLY ONE ACTIVE COURSE
    // ========================================================

    if (
      activeOptions.length ===
      1
    ) {
      const selected =
        activeOptions[0]

      preference
        .activeEnrollmentId =
        selected.enrollmentId

      preference
        .activeCourseId =
        selected.courseId

      preference
        .contextSelectedAt =
        new Date()

      preference
        .awaitingCourseSelection =
        false

      await preference.save()

      const state =
        await SelfPacedMentorState
          .findOne({
            selfPacedStudentId:
              studentId,

            enrollmentId:
              selected
                .enrollmentId,

            courseId:
              selected
                .courseId,

            status:
              'active',
          })

      context = {
        enrollmentId:
          selected
            .enrollmentId,

        courseId:
          selected
            .courseId,

        state,
      }
    } else {
      // ======================================================
      // MULTIPLE ACTIVE COURSES
      // ======================================================

      const inbound =
        await saveInboundMessage({
          studentId,

          context:
            null,

          phone,

          messageText,

          message,
        })

      if (!inbound) {
        return
      }

      await requestCourseSelection({
        studentId,

        firstName,

        phone,

        preference,

        options:
          activeOptions,
      })

      return
    }
  }

  // ==========================================================
  // SAVE NORMAL INBOUND MESSAGE
  // ==========================================================

  const inbound =
    await saveInboundMessage({
      studentId,

      context,

      phone,

      messageText,

      message,
    })

  if (!inbound) {
    return
  }

  // ==========================================================
  // EXPLICIT HUMAN SUPPORT REQUEST
  // ==========================================================

  if (
    isHumanSupportRequest(
      messageText
    )
  ) {
    await sendHumanEscalationConfirmation({
      studentId,

      firstName,

      phone,

      context,

      sourceMessageId:
        inbound
          .savedMessage
          ._id,

      studentMessage:
        messageText,

      reason:
        'student_requested_human',
    })

    return
  }

  // ==========================================================
  // NORMAL AI MENTOR FLOW
  // ==========================================================

  await sendAIMentorResponse({
    studentId,

    firstName,

    phone,

    messageText,

    context,

    sourceMessageId:
      inbound
        .savedMessage
        ._id,
  })
}

// ============================================================
// POST WEBHOOK
// ============================================================

export async function POST(
  request: NextRequest
) {
  /*
   * IMPORTANT:
   *
   * Read the raw body first.
   *
   * Meta signs the exact raw request body using the app secret,
   * so parsing JSON before signature verification would make
   * reliable signature verification impossible.
   */
  let rawBody: string

  try {
    rawBody =
      await request.text()
  } catch (error) {
    console.error(
      'Could not read WhatsApp webhook body:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Invalid webhook body.',
      },
      {
        status: 400,
      }
    )
  }

  // ==========================================================
  // VERIFY META SIGNATURE
  // ==========================================================

  const signatureHeader =
    request.headers.get(
      'x-hub-signature-256'
    )

  const signatureValid =
    verifyWebhookSignature(
      rawBody,
      signatureHeader
    )

  if (!signatureValid) {
    console.warn(
      'Rejected WhatsApp webhook because signature verification failed.'
    )

    return NextResponse.json(
      {
        error:
          'Invalid webhook signature.',
      },
      {
        status: 401,
      }
    )
  }

  // ==========================================================
  // PARSE JSON
  // ==========================================================

  let payload:
    WhatsAppWebhookPayload

  try {
    payload =
      JSON.parse(
        rawBody
      ) as
        WhatsAppWebhookPayload
  } catch (error) {
    console.error(
      'Could not parse WhatsApp webhook JSON:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Invalid webhook JSON.',
      },
      {
        status: 400,
      }
    )
  }

  // ==========================================================
  // IGNORE NON-WHATSAPP PAYLOADS
  // ==========================================================

  if (
    payload.object &&
    payload.object !==
      'whatsapp_business_account'
  ) {
    /*
     * Meta expects webhook endpoints to acknowledge events.
     * There is nothing for the mentor to process here.
     */
    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    )
  }

  // ==========================================================
  // CONNECT DATABASE
  // ==========================================================

  try {
    await connectDB()
  } catch (error) {
    console.error(
      'WhatsApp webhook database connection failed:',
      error
    )

    /*
     * Return a server error here because the event was not
     * actually processed. This allows the provider to retry
     * rather than silently losing the message.
     */
    return NextResponse.json(
      {
        error:
          'Database connection failed.',
      },
      {
        status: 500,
      }
    )
  }

  // ==========================================================
  // PROCESS WEBHOOK ENTRIES
  // ==========================================================

  try {
    for (
      const entry of
      payload.entry || []
    ) {
      for (
        const change of
        entry.changes || []
      ) {
        /*
         * We only care about WhatsApp message changes.
         */
        if (
          change.field &&
          change.field !==
            'messages'
        ) {
          continue
        }

        const value =
          change.value

        if (!value) {
          continue
        }

        // ====================================================
        // DELIVERY / READ / FAILURE STATUS EVENTS
        // ====================================================

        for (
          const status of
          value.statuses || []
        ) {
          try {
            await handleMessageStatus(
              status
            )
          } catch (error) {
            /*
             * One malformed status update should not prevent an
             * inbound student message in the same webhook from
             * being processed.
             */
            console.error(
              'Failed to process WhatsApp message status:',
              error
            )
          }
        }

        // ====================================================
        // INBOUND STUDENT MESSAGES
        // ====================================================

        for (
          const message of
          value.messages || []
        ) {
          try {
            await handleInboundMessage(
              message
            )
          } catch (error) {
            /*
             * Log the individual message failure and continue
             * processing other messages contained in the same
             * webhook payload.
             */
            console.error(
              'Failed to process inbound WhatsApp mentor message:',
              error
            )
          }
        }
      }
    }

    // ========================================================
    // ACKNOWLEDGE WEBHOOK
    // ========================================================

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'Unexpected WhatsApp webhook processing error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Webhook processing failed.',
      },
      {
        status: 500,
      }
    )
  }
}