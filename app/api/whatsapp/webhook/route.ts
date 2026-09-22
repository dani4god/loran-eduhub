// app/api/whatsapp/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
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
  enrollmentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  courseTitle: string
}

interface CourseContext {
  enrollmentId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  state: InstanceType<
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
    request.nextUrl.searchParams.get(
      'hub.mode'
    )

  const token =
    request.nextUrl.searchParams.get(
      'hub.verify_token'
    )

  const challenge =
    request.nextUrl.searchParams.get(
      'hub.challenge'
    )

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN

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
    process.env.WHATSAPP_APP_SECRET

  if (!appSecret) {
    console.error(
      'WHATSAPP_APP_SECRET is not configured.'
    )

    return false
  }

  if (!signatureHeader) {
    return false
  }

  const prefix = 'sha256='

  if (
    !signatureHeader.startsWith(prefix)
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

    return crypto.timingSafeEqual(
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
    !Number.isFinite(seconds)
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
  message: WhatsAppInboundMessage
): string | null {
  if (
    message.type === 'text' &&
    message.text?.body
  ) {
    return message.text.body.trim()
  }

  if (
    message.type === 'button'
  ) {
    return (
      message.button?.text?.trim() ||
      message.button?.payload?.trim() ||
      null
    )
  }

  if (
    message.type === 'interactive'
  ) {
    if (
      message.interactive
        ?.button_reply?.title
    ) {
      return message.interactive
        .button_reply.title.trim()
    }

    if (
      message.interactive
        ?.list_reply?.title
    ) {
      return message.interactive
        .list_reply.title.trim()
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
    Record<string, unknown> = {
      status: status.status,
    }

  const eventDate =
    whatsappTimestampToDate(
      status.timestamp
    )

  if (
    status.status === 'sent'
  ) {
    update.sentAt = eventDate
  }

  if (
    status.status === 'delivered'
  ) {
    update.deliveredAt =
      eventDate
  }

  if (
    status.status === 'read'
  ) {
    update.readAt =
      eventDate
  }

  if (
    status.status === 'failed'
  ) {
    const error =
      status.errors?.[0]

    update.errorMessage =
      error?.error_data?.details ||
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
    enrollments.length === 0
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
          $in: courseIds,
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
    const course of courses
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
      ): ActiveEnrollmentOption | null => {
        const courseTitle =
          courseTitleMap.get(
            enrollment.courseId.toString()
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
      ): option is ActiveEnrollmentOption =>
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
    !preference.activeEnrollmentId ||
    !preference.activeCourseId
  ) {
    return null
  }

  const enrollment =
    await SelfPacedEnrollment
      .findOne({
        _id:
          preference.activeEnrollmentId,

        selfPacedStudentId:
          preference.selfPacedStudentId,

        courseId:
          preference.activeCourseId,

        completedAt: {
          $exists: false,
        },
      })
      .select(
        '_id courseId'
      )
      .lean()

  if (!enrollment) {
    preference.activeEnrollmentId =
      undefined

    preference.activeCourseId =
      undefined

    preference.contextSelectedAt =
      undefined

    preference.awaitingCourseSelection =
      false

    await preference.save()

    return null
  }

  const state =
    await SelfPacedMentorState
      .findOne({
        selfPacedStudentId:
          preference.selfPacedStudentId,

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

  metadata?: Record<
    string,
    unknown
  >
}) {
  await SelfPacedMentorMessage.create({
    selfPacedStudentId,
    enrollmentId,
    courseId,

    direction:
      'outbound',

    type:
      'manual',

    phone,
    message,

    whatsappMessageId,

    status,

    errorMessage,

    sentAt:
      status === 'sent'
        ? new Date()
        : undefined,

    metadata,
  })
}

// ============================================================
// SEND AND LOG WHATSAPP TEXT
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

  metadata?: Record<
    string,
    unknown
  >
}) {
  const result =
    await sendWhatsAppText(
      phone,
      message
    )

  await saveOutboundMessage({
    selfPacedStudentId,
    enrollmentId,
    courseId,
    phone,
    message,

    whatsappMessageId:
      result.messageId,

    status:
      result.success
        ? 'sent'
        : 'failed',

    errorMessage:
      result.success
        ? undefined
        : result.error,

    metadata,
  })

  return result
}

// ============================================================
// BUILD COURSE SELECTION MESSAGE
// ============================================================

function buildCourseSelectionMessage(
  firstName: string,
  options:
    ActiveEnrollmentOption[]
): string {
  const courseLines =
    options.map(
      (
        option,
        index
      ) =>
        `${index + 1}. ${option.courseTitle}`
    )

  return [
    `Hi ${firstName} 👋`,
    '',
    'Welcome to your Loran EduHub WhatsApp Mentor.',
    '',
    'You are currently enrolled in multiple active courses.',
    '',
    'Which course would you like help with?',
    '',
    ...courseLines,
    '',
    `Reply with a number from 1 to ${options.length}.`,
  ].join('\n')
}

// ============================================================
// SEND COURSE SELECTION
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
  const message =
    buildCourseSelectionMessage(
      firstName,
      options
    )

  const result =
    await sendAndLogText({
      selfPacedStudentId:
        studentId,

      phone,

      message,

      metadata: {
        purpose:
          'course_selection',

        courseOptions:
          options.map(
            (
              option,
              index
            ) => ({
              number:
                index + 1,

              enrollmentId:
                option.enrollmentId.toString(),

              courseId:
                option.courseId.toString(),

              courseTitle:
                option.courseTitle,
            })
          ),
      },
    })

  if (result.success) {
    preference.awaitingCourseSelection =
      true

    preference.activeEnrollmentId =
      undefined

    preference.activeCourseId =
      undefined

    preference.contextSelectedAt =
      undefined

    await preference.save()
  }
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
}): Promise<
  CourseContext | null
> {
  const trimmed =
    messageText.trim()

  const selection =
    Number(trimmed)

  if (
    !Number.isInteger(
      selection
    ) ||
    selection < 1 ||
    selection >
      options.length
  ) {
    const retryMessage =
      [
        `Hi ${firstName}, please choose one of your courses by replying with its number.`,
        '',
        ...options.map(
          (
            option,
            index
          ) =>
            `${index + 1}. ${option.courseTitle}`
        ),
        '',
        `Reply with a number from 1 to ${options.length}.`,
      ].join('\n')

    await sendAndLogText({
      selfPacedStudentId:
        studentId,

      phone,

      message:
        retryMessage,

      metadata: {
        purpose:
          'course_selection_retry',
      },
    })

    return null
  }

  const selected =
    options[
      selection - 1
    ]

  preference.activeEnrollmentId =
    selected.enrollmentId

  preference.activeCourseId =
    selected.courseId

  preference.contextSelectedAt =
    new Date()

  preference.awaitingCourseSelection =
    false

  await preference.save()

  const state =
    await SelfPacedMentorState
      .findOne({
        selfPacedStudentId:
          studentId,

        enrollmentId:
          selected.enrollmentId,

        courseId:
          selected.courseId,

        status:
          'active',
      })

  const confirmation =
    [
      `Great, ${firstName} 👍`,
      '',
      `We'll continue with *${selected.courseTitle}*.`,
      '',
      'You can now ask me about your progress, what to study next, or anything you need help understanding in this course.',
    ].join('\n')

  await sendAndLogText({
    selfPacedStudentId:
      studentId,

    enrollmentId:
      selected.enrollmentId,

    courseId:
      selected.courseId,

    phone,

    message:
      confirmation,

    metadata: {
      purpose:
        'course_selection_confirmed',

      selectedCourseTitle:
        selected.courseTitle,
    },
  })

  return {
    enrollmentId:
      selected.enrollmentId,

    courseId:
      selected.courseId,

    state,
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
  const receivedAt =
    whatsappTimestampToDate(
      message.timestamp
    )

  try {
    const savedMessage =
      await SelfPacedMentorMessage.create({
        selfPacedStudentId:
          studentId,

        enrollmentId:
          context?.enrollmentId,

        courseId:
          context?.courseId,

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
            Boolean(context),
        },
      })

    return {
      savedMessage,
      receivedAt,
    }
  } catch (
    error: unknown
  ) {
    if (
      typeof error ===
        'object' &&
      error !== null &&
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
// GENERATE AND SEND AI MENTOR RESPONSE
// ============================================================

async function sendAIMentorResponse({
  studentId,
  firstName,
  phone,
  messageText,
  context,
}: {
  studentId:
    mongoose.Types.ObjectId

  firstName: string

  phone: string

  messageText: string

  context:
    CourseContext
}) {
  try {
    const mentorReply =
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
          mentorReply,

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
  } catch (error) {
    console.error(
      'WhatsApp mentor AI error:',
      error
    )

    const fallbackMessage =
      [
        `Thanks, ${firstName}.`,
        '',
        'I received your message, but I am having trouble preparing your mentor response right now.',
        '',
        'Please try again shortly.',
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

  const phone =
    normalizeWhatsAppPhone(
      message.from
    )

  const messageText =
    extractMessageText(
      message
    )

  if (!messageText) {
    console.log(
      'Ignoring unsupported WhatsApp message type:',
      message.type
    )

    return
  }

  // ==========================================================
  // DUPLICATE PROTECTION
  // ==========================================================

  const existingMessage =
    await SelfPacedMentorMessage
      .findOne({
        whatsappMessageId:
          message.id,
      })
      .select('_id')
      .lean()

  if (existingMessage) {
    return
  }

  // ==========================================================
  // FIND MENTOR PREFERENCE
  // ==========================================================

  const preference =
    await SelfPacedMentorPreference
      .findOne({
        whatsappPhone:
          phone,
      })

  if (!preference) {
    console.warn(
      'WhatsApp message received from an unknown number.'
    )

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
        preference.selfPacedStudentId
      )

  if (!student) {
    console.error(
      'Mentor preference references a missing student.'
    )

    return
  }

  const studentId =
    student._id as
      mongoose.Types.ObjectId

  const firstName =
    student.firstName
      ?.trim() ||
    'there'

  // ==========================================================
  // FIND ACTIVE ENROLLMENTS
  // ==========================================================

  const options =
    await getActiveEnrollmentOptions(
      studentId
    )

  // ==========================================================
  // EXISTING SAVED CONTEXT
  // ==========================================================

  let context =
    await getSavedCourseContext(
      preference
    )

  // ==========================================================
  // COURSE SELECTION RESPONSE
  // ==========================================================

  if (
    !context &&
    preference.awaitingCourseSelection
  ) {
    /*
     * At this point the incoming message is a response to the
     * course-selection question.
     *
     * We save it before trying to interpret the selection.
     */
    const inbound =
      await saveInboundMessage({
        studentId,
        context: null,
        phone,
        messageText,
        message,
      })

    if (!inbound) {
      return
    }

    preference.lastStudentReplyAt =
      inbound.receivedAt

    preference.lastInboundPhone =
      phone

    await preference.save()

    await handleCourseSelectionResponse({
      studentId,
      firstName,
      phone,
      messageText,
      preference,
      options,
    })

    return
  }

  // ==========================================================
  // NO SAVED CONTEXT
  // ==========================================================

  if (!context) {
    // --------------------------------------------------------
    // EXACTLY ONE ACTIVE COURSE
    // --------------------------------------------------------

    if (
      options.length === 1
    ) {
      const onlyCourse =
        options[0]

      preference.activeEnrollmentId =
        onlyCourse.enrollmentId

      preference.activeCourseId =
        onlyCourse.courseId

      preference.contextSelectedAt =
        new Date()

      preference.awaitingCourseSelection =
        false

      await preference.save()

      const state =
        await SelfPacedMentorState
          .findOne({
            selfPacedStudentId:
              studentId,

            enrollmentId:
              onlyCourse.enrollmentId,

            courseId:
              onlyCourse.courseId,

            status:
              'active',
          })

      context = {
        enrollmentId:
          onlyCourse.enrollmentId,

        courseId:
          onlyCourse.courseId,

        state,
      }
    }

    // --------------------------------------------------------
    // MULTIPLE ACTIVE COURSES
    // --------------------------------------------------------

    else if (
      options.length > 1
    ) {
      const inbound =
        await saveInboundMessage({
          studentId,
          context: null,
          phone,
          messageText,
          message,
        })

      if (!inbound) {
        return
      }

      preference.lastStudentReplyAt =
        inbound.receivedAt

      preference.lastInboundPhone =
        phone

      await preference.save()

      await requestCourseSelection({
        studentId,
        firstName,
        phone,
        preference,
        options,
      })

      return
    }

    // --------------------------------------------------------
    // NO ACTIVE COURSE
    // --------------------------------------------------------

    else {
      const inbound =
        await saveInboundMessage({
          studentId,
          context: null,
          phone,
          messageText,
          message,
        })

      if (!inbound) {
        return
      }

      preference.lastStudentReplyAt =
        inbound.receivedAt

      preference.lastInboundPhone =
        phone

      await preference.save()

      const noCourseMessage =
        [
          `Hi ${firstName} 👋`,
          '',
          'I received your message, but I could not find an active self-paced course on your account.',
          '',
          'Please open Loran EduHub and check your self-paced enrollments.',
        ].join('\n')

      await sendAndLogText({
        selfPacedStudentId:
          studentId,

        phone,

        message:
          noCourseMessage,

        metadata: {
          purpose:
            'no_active_course',
        },
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
  // UPDATE STUDENT-LEVEL ACTIVITY
  // ==========================================================

  preference.lastStudentReplyAt =
    inbound.receivedAt

  preference.lastInboundPhone =
    phone

  await preference.save()

  // ==========================================================
  // ACTUAL AI MENTOR RESPONSE
  // ==========================================================

  await sendAIMentorResponse({
    studentId,
    firstName,
    phone,
    messageText,
    context,
  })

  console.log(
    'WhatsApp inbound message stored and mentor response processed:',
    inbound.savedMessage._id.toString()
  )
}

// ============================================================
// POST WEBHOOK
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ========================================================
    // READ RAW BODY
    // ========================================================

    /*
     * Meta signature verification must use the exact original
     * request body. Do not call request.json() before this.
     */
    const rawBody =
      await request.text()

    // ========================================================
    // VERIFY SIGNATURE
    // ========================================================

    const signature =
      request.headers.get(
        'x-hub-signature-256'
      )

    if (
      !verifyWebhookSignature(
        rawBody,
        signature
      )
    ) {
      console.warn(
        'Rejected WhatsApp webhook with invalid signature.'
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

    // ========================================================
    // PARSE JSON
    // ========================================================

    let payload:
      WhatsAppWebhookPayload

    try {
      payload =
        JSON.parse(
          rawBody
        ) as WhatsAppWebhookPayload
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON payload.',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // BASIC PAYLOAD CHECK
    // ========================================================

    if (
      payload.object !==
      'whatsapp_business_account'
    ) {
      return NextResponse.json({
        received: true,
      })
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // PROCESS ENTRIES
    // ========================================================

    for (
      const entry of
      payload.entry || []
    ) {
      for (
        const change of
        entry.changes || []
      ) {
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

        // ----------------------------------------------------
        // DELIVERY / READ / FAILURE STATUSES
        // ----------------------------------------------------

        for (
          const status of
          value.statuses || []
        ) {
          await handleMessageStatus(
            status
          )
        }

        // ----------------------------------------------------
        // INBOUND STUDENT MESSAGES
        // ----------------------------------------------------

        for (
          const message of
          value.messages || []
        ) {
          await handleInboundMessage(
            message
          )
        }
      }
    }

    // ========================================================
    // ACKNOWLEDGE
    // ========================================================

    return NextResponse.json({
      received: true,
    })
  } catch (error) {
    console.error(
      'WhatsApp webhook processing error:',
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