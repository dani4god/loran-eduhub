import crypto from 'crypto'
import { promisify } from 'util'
import { NextRequest, NextResponse } from 'next/server'

import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepAuthSession from '@/models/ExamPrepAuthSession'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'

const scryptAsync = promisify(crypto.scrypt)

export const EXAM_PREP_COOKIE = 'loran_exam_prep_session'

const SESSION_MS = 30 * 24 * 60 * 60 * 1000

export function validateExamPrepPin(pin: unknown) {
  return /^\d{6}$/.test(String(pin || ''))
}

export async function hashExamPrepPin(pin: string) {
  if (!validateExamPrepPin(pin)) {
    throw new Error('PIN must contain exactly 6 digits')
  }

  const salt = crypto.randomBytes(16).toString('hex')

  const derived = (await scryptAsync(
    pin,
    salt,
    64
  )) as Buffer

  return `${salt}:${derived.toString('hex')}`
}

export async function verifyExamPrepPin(
  pin: string,
  storedHash: string
) {
  try {
    const [salt, storedKey] = storedHash.split(':')

    if (!salt || !storedKey) {
      return false
    }

    const derived = (await scryptAsync(
      pin,
      salt,
      64
    )) as Buffer

    const stored = Buffer.from(
      storedKey,
      'hex'
    )

    return (
      stored.length === derived.length &&
      crypto.timingSafeEqual(
        stored,
        derived
      )
    )
  } catch {
    return false
  }
}

function hashSessionToken(token: string) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
}

export async function issueExamPrepSession(
  studentId: string,
  userAgent?: string | null
) {
  await connectDB()

  const rawToken = crypto
    .randomBytes(32)
    .toString('base64url')

  const expiresAt = new Date(
    Date.now() + SESSION_MS
  )

  await ExamPrepAuthSession.create({
    examPrepStudentId: studentId,

    tokenHash:
      hashSessionToken(rawToken),

    expiresAt,

    lastUsedAt: new Date(),

    userAgent: String(
      userAgent || ''
    ).slice(0, 500),
  })

  return {
    rawToken,
    expiresAt,
  }
}

export function setExamPrepSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
) {
  response.cookies.set({
    name: EXAM_PREP_COOKIE,
    value: token,

    httpOnly: true,

    secure:
      process.env.NODE_ENV ===
      'production',

    sameSite: 'lax',

    path: '/',

    expires: expiresAt,
  })
}

export function clearExamPrepSessionCookie(
  response: NextResponse
) {
  response.cookies.set({
    name: EXAM_PREP_COOKIE,

    value: '',

    httpOnly: true,

    secure:
      process.env.NODE_ENV ===
      'production',

    sameSite: 'lax',

    path: '/',

    expires: new Date(0),
  })
}

export async function requireExamPrepStudent(
  req: NextRequest
) {
  await connectDB()

  const rawToken =
    req.cookies.get(
      EXAM_PREP_COOKIE
    )?.value

  if (!rawToken) {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error:
            'Exam Prep login required.',

          code:
            'EXAM_PREP_LOGIN_REQUIRED',

          requiresLogin: true,
        },
        {
          status: 401,
        }
      ),
    }
  }

  const session =
    await ExamPrepAuthSession.findOne({
      tokenHash:
        hashSessionToken(rawToken),

      expiresAt: {
        $gt: new Date(),
      },
    })

  if (!session) {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error:
            'Your Exam Prep session has expired.',

          code:
            'EXAM_PREP_SESSION_EXPIRED',

          requiresLogin: true,
        },
        {
          status: 401,
        }
      ),
    }
  }

  const student =
    await ExamPrepStudent.findById(
      session.examPrepStudentId
    )

  if (!student) {
    await ExamPrepAuthSession.deleteOne({
      _id: session._id,
    })

    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error:
            'Account not found.',

          code:
            'EXAM_PREP_ACCOUNT_NOT_FOUND',

          requiresLogin: true,
        },
        {
          status: 401,
        }
      ),
    }
  }

  const tenMinutesAgo =
    Date.now() -
    10 * 60 * 1000

  if (
    !session.lastUsedAt ||
    new Date(
      session.lastUsedAt
    ).getTime() <
      tenMinutesAgo
  ) {
    void ExamPrepAuthSession.updateOne(
      {
        _id: session._id,
      },
      {
        $set: {
          lastUsedAt:
            new Date(),
        },
      }
    )
  }

  return {
    ok: true as const,
    student,
    session,
  }
}

export async function requireExamPrepAccess(
  req: NextRequest
) {
  const auth =
    await requireExamPrepStudent(
      req
    )

  if (!auth.ok) {
    return auth
  }

  await connectDB()

  /*
   * -------------------------------------------------------
   * EXAM PREP GLOBAL SETTINGS
   * -------------------------------------------------------
   *
   * If there is no settings record yet,
   * Exam Prep behaves as unlocked/free.
   */
  const settings =
    await ExamPrepSettings.findOne({
      key: 'global',
    })

  /*
   * -------------------------------------------------------
   * GLOBAL LOCK
   * -------------------------------------------------------
   *
   * This takes priority over subscription status.
   *
   * Even a student with an active subscription
   * cannot start protected Exam Prep activities
   * while the admin has locked Exam Prep.
   */
  if (settings?.isLocked) {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error:
            'Exam Prep is currently unavailable. Please try again later.',

          code:
            'EXAM_PREP_LOCKED',

          isLocked: true,
        },
        {
          status: 403,
        }
      ),
    }
  }

  /*
   * -------------------------------------------------------
   * SUBSCRIPTION
   * -------------------------------------------------------
   */
  const subscription =
    await ExamPrepSubscription.findOne(
      {
        examPrepStudentId:
          auth.student._id,
      }
    )

  /*
   * Access is allowed when:
   *
   * 1. Admin has made Exam Prep free
   * 2. Student was granted free access at registration
   * 3. Student has lifetime access
   * 4. Student has an active dated subscription
   */
  const hasAccess =
    !settings?.isPaid ||
    subscription
      ?.wasFreeAtRegistration ===
      true ||
    subscription?.planDuration ===
      'life' ||
    Boolean(
      subscription?.endDate &&
        new Date(
          subscription.endDate
        ).getTime() >
          Date.now()
    )

  if (!hasAccess) {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error:
            'An active Exam Prep subscription is required.',

          code:
            'EXAM_PREP_SUBSCRIPTION_REQUIRED',

          requiresPayment: true,
        },
        {
          status: 403,
        }
      ),
    }
  }

  return {
    ...auth,

    settings,

    subscription,

    hasAccess: true as const,
  }
}

export async function revokeCurrentExamPrepSession(
  req: NextRequest
) {
  await connectDB()

  const rawToken =
    req.cookies.get(
      EXAM_PREP_COOKIE
    )?.value

  if (!rawToken) {
    return
  }

  await ExamPrepAuthSession.deleteOne(
    {
      tokenHash:
        hashSessionToken(
          rawToken
        ),
    }
  )
}