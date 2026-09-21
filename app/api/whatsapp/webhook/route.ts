// app/api/whatsapp/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

import connectDB from '@/lib/mongodb'
import {
  normalizeWhatsAppPhone,
} from '@/lib/whatsapp'

import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
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
    update.readAt = eventDate
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

  await SelfPacedMentorMessage.findOneAndUpdate(
    {
      whatsappMessageId:
        status.id,
    },
    {
      $set: update,
    }
  )
}

// ============================================================
// FIND ACTIVE COURSE CONTEXT
// ============================================================

async function findCourseContext(
  selfPacedStudentId: string
) {
  /*
   * First preference:
   * use the course whose mentor state most recently
   * communicated with the student.
   */

  const recentState =
    await SelfPacedMentorState
      .findOne({
        selfPacedStudentId,
        status: 'active',
      })
      .sort({
        lastMentorMessageAt: -1,
        updatedAt: -1,
      })

  if (recentState) {
    return {
      enrollmentId:
        recentState.enrollmentId,

      courseId:
        recentState.courseId,

      state:
        recentState,
    }
  }

  /*
   * If no mentor state exists yet, check the student's
   * actual enrollments.
   *
   * If exactly one unfinished enrollment exists,
   * that course is unambiguous.
   */

  const enrollments =
    await SelfPacedEnrollment
      .find({
        selfPacedStudentId,
        completedAt: {
          $exists: false,
        },
      })
      .sort({
        lastActivityAt: -1,
        updatedAt: -1,
      })
      .limit(2)

  if (enrollments.length === 1) {
    return {
      enrollmentId:
        enrollments[0]._id,

      courseId:
        enrollments[0].courseId,

      state: null,
    }
  }

  /*
   * Zero active courses or multiple possible courses:
   * do not guess.
   */
  return null
}

// ============================================================
// HANDLE INBOUND MESSAGE
// ============================================================

async function handleInboundMessage(
  message: WhatsAppInboundMessage
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

  /*
   * V1 supports text/button/list replies.
   *
   * Images, voice notes, documents, video, location,
   * stickers, etc. can be added later.
   */
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
    await SelfPacedMentorMessage.findOne({
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
    await SelfPacedMentorPreference.findOne({
      whatsappPhone: phone,
    })

  if (!preference) {
    /*
     * We deliberately do not create a student account or
     * mentor preference from an unknown WhatsApp number.
     */
    console.warn(
      'WhatsApp message received from an unknown number.'
    )

    return
  }

  // ==========================================================
  // FIND STUDENT
  // ==========================================================

  const student =
    await SelfPacedStudent.findById(
      preference.selfPacedStudentId
    )

  if (!student) {
    console.error(
      'Mentor preference references a missing student.'
    )

    return
  }

  // ==========================================================
  // COURSE CONTEXT
  // ==========================================================

  const context =
    await findCourseContext(
      student._id.toString()
    )

  const receivedAt =
    whatsappTimestampToDate(
      message.timestamp
    )

  // ==========================================================
  // SAVE MESSAGE
  // ==========================================================

  let savedMessage

  try {
    savedMessage =
      await SelfPacedMentorMessage.create({
        selfPacedStudentId:
          student._id,

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
  } catch (error: unknown) {
    /*
     * Meta may retry webhook deliveries.
     *
     * The unique whatsappMessageId index protects the
     * database even if two deliveries race each other.
     */
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number })
        .code === 11000
    ) {
      return
    }

    throw error
  }

  // ==========================================================
  // UPDATE STUDENT-LEVEL MENTOR ACTIVITY
  // ==========================================================

  preference.lastStudentReplyAt =
    receivedAt

  preference.lastInboundPhone =
    phone

  await preference.save()

  // ==========================================================
  // UPDATE COURSE STATE
  // ==========================================================

  if (context?.state) {
    context.state.updatedAt =
      new Date()

    await context.state.save()
  }

  /*
   * IMPORTANT:
   *
   * We stop here for now.
   *
   * Do not call Groq directly from the webhook yet.
   *
   * First establish that:
   * 1. Meta reaches this endpoint.
   * 2. Signatures verify.
   * 3. Replies are stored.
   * 4. Status callbacks update messages.
   *
   * Then the next layer can safely process savedMessage.
   */

  console.log(
    'WhatsApp inbound message stored:',
    savedMessage._id.toString()
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
     * Signature verification must use the original request
     * body, so do NOT call request.json() before this.
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
      /*
       * Acknowledge payloads that are not relevant rather
       * than repeatedly asking the provider to retry them.
       */
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