// lib/examPrepDiscordOAuth.ts

import crypto from 'crypto'

// ============================================================
// CONFIG
// ============================================================

export const EXAM_PREP_DISCORD_OAUTH_COOKIE =
  'loran_exam_prep_discord_oauth'

const STATE_MAX_AGE_MS =
  10 * 60 * 1000

type DiscordOAuthStatePayload = {
  studentId: string
  nonce: string
  issuedAt: number
}

// ============================================================
// SECRET
// ============================================================

function getSecret() {
  const secret =
    process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET is required for Exam Prep Discord OAuth.'
    )
  }

  return secret
}

// ============================================================
// SIGN
// ============================================================

function signPayload(
  payload: string
) {
  return crypto
    .createHmac(
      'sha256',
      getSecret()
    )
    .update(payload)
    .digest('base64url')
}

// ============================================================
// CREATE STATE
// ============================================================

export function createExamPrepDiscordOAuthState(
  studentId: string
) {
  const nonce =
    crypto
      .randomBytes(24)
      .toString('base64url')

  const payload: DiscordOAuthStatePayload =
    {
      studentId:
        String(studentId),

      nonce,

      issuedAt:
        Date.now(),
    }

  const encodedPayload =
    Buffer
      .from(
        JSON.stringify(
          payload
        ),
        'utf8'
      )
      .toString(
        'base64url'
      )

  const signature =
    signPayload(
      encodedPayload
    )

  return {
    state:
      `${encodedPayload}.${signature}`,

    nonce,
  }
}

// ============================================================
// VERIFY STATE
// ============================================================

export function verifyExamPrepDiscordOAuthState(
  state: string
):
  | {
      ok: true
      payload:
        DiscordOAuthStatePayload
    }
  | {
      ok: false
    } {
  try {
    const [
      encodedPayload,
      receivedSignature,
    ] =
      String(
        state ||
          ''
      ).split('.')

    if (
      !encodedPayload ||
      !receivedSignature
    ) {
      return {
        ok:
          false,
      }
    }

    const expectedSignature =
      signPayload(
        encodedPayload
      )

    const receivedBuffer =
      Buffer.from(
        receivedSignature
      )

    const expectedBuffer =
      Buffer.from(
        expectedSignature
      )

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return {
        ok:
          false,
      }
    }

    if (
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      )
    ) {
      return {
        ok:
          false,
      }
    }

    const payload =
      JSON.parse(
        Buffer
          .from(
            encodedPayload,
            'base64url'
          )
          .toString(
            'utf8'
          )
      ) as DiscordOAuthStatePayload

    if (
      !payload.studentId ||
      !payload.nonce ||
      !payload.issuedAt
    ) {
      return {
        ok:
          false,
      }
    }

    const age =
      Date.now() -
      Number(
        payload.issuedAt
      )

    if (
      age <
        0 ||
      age >
        STATE_MAX_AGE_MS
    ) {
      return {
        ok:
          false,
      }
    }

    return {
      ok:
        true,

      payload,
    }
  } catch {
    return {
      ok:
        false,
    }
  }
}