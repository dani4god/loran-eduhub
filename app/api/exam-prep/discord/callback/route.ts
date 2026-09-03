// app/api/exam-prep/discord/callback/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import ExamPrepStudent from '@/models/ExamPrepStudent'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

import {
  hasExamPrepCommunityAccess,
  syncExamPrepStudentDiscordRoles,
} from '@/lib/discordSync'

import {
  verifyExamPrepDiscordOAuthState,
  EXAM_PREP_DISCORD_OAUTH_COOKIE,
} from '@/lib/examPrepDiscordOAuth'

// ============================================================
// REDIRECT HELPER
// ============================================================

function dashboardRedirect(
  req:
    NextRequest,
  params:
    Record<
      string,
      string
    >
) {
  const url =
    new URL(
      '/exam-prep/dashboard/discord',
      process.env
        .NEXTAUTH_URL ||
        req.nextUrl.origin
    )

  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      params
    )
  ) {
    url.searchParams.set(
      key,
      value
    )
  }

  const response =
    NextResponse.redirect(
      url
    )

  response.cookies.set({
    name:
      EXAM_PREP_DISCORD_OAUTH_COOKIE,

    value:
      '',

    httpOnly:
      true,

    secure:
      process.env.NODE_ENV ===
      'production',

    sameSite:
      'lax',

    path:
      '/',

    expires:
      new Date(0),
  })

  return response
}

// ============================================================
// GET CALLBACK
// ============================================================

export async function GET(
  req:
    NextRequest
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        req.url
      )

    const code =
      searchParams.get(
        'code'
      )

    const state =
      searchParams.get(
        'state'
      )

    const discordError =
      searchParams.get(
        'error'
      )

    if (
      discordError
    ) {
      return dashboardRedirect(
        req,
        {
          error:
            'cancelled',
        }
      )
    }

    if (
      !code ||
      !state
    ) {
      return dashboardRedirect(
        req,
        {
          error:
            'oauth',
        }
      )
    }

    // ========================================================
    // CURRENT EXAM PREP SESSION
    // ========================================================

    const auth =
      await requireExamPrepStudent(
        req
      )

    if (
      !auth.ok
    ) {
      return dashboardRedirect(
        req,
        {
          error:
            'session',
        }
      )
    }

    // ========================================================
    // VERIFY SIGNED STATE
    // ========================================================

    const verified =
      verifyExamPrepDiscordOAuthState(
        state
      )

    if (
      !verified.ok
    ) {
      return dashboardRedirect(
        req,
        {
          error:
            'state',
        }
      )
    }

    const cookieNonce =
      req.cookies.get(
        EXAM_PREP_DISCORD_OAUTH_COOKIE
      )?.value

    if (
      !cookieNonce ||
      cookieNonce !==
        verified.payload
          .nonce
    ) {
      return dashboardRedirect(
        req,
        {
          error:
            'state',
        }
      )
    }

    if (
      String(
        auth.student._id
      ) !==
      String(
        verified.payload
          .studentId
      )
    ) {
      return dashboardRedirect(
        req,
        {
          error:
            'account',
        }
      )
    }

    // ========================================================
    // SUBSCRIPTION
    // ========================================================

    const hasAccess =
      await hasExamPrepCommunityAccess(
        String(
          auth.student._id
        )
      )

    if (
      !hasAccess
    ) {
      return dashboardRedirect(
        req,
        {
          error:
            'subscription',
        }
      )
    }

    // ========================================================
    // DISCORD CONFIG
    // ========================================================

    const clientId =
      process.env
        .DISCORD_CLIENT_ID

    const clientSecret =
      process.env
        .DISCORD_CLIENT_SECRET

    if (
      !clientId ||
      !clientSecret
    ) {
      throw new Error(
        'Discord OAuth credentials are not configured.'
      )
    }

    const appUrl =
      process.env
        .NEXTAUTH_URL ||
      req.nextUrl.origin

    const redirectUri =
      `${appUrl}/api/exam-prep/discord/callback`

    // ========================================================
    // EXCHANGE AUTHORIZATION CODE
    // ========================================================

    const tokenRes =
      await fetch(
        'https://discord.com/api/oauth2/token',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',
          },

          body:
            new URLSearchParams({
              client_id:
                clientId,

              client_secret:
                clientSecret,

              grant_type:
                'authorization_code',

              code,

              redirect_uri:
                redirectUri,
            }),
        }
      )

    const tokenData =
      await tokenRes.json()

    if (
      !tokenRes.ok ||
      !tokenData
        ?.access_token
    ) {
      console.error(
        'Discord OAuth token response:',
        tokenData
      )

      return dashboardRedirect(
        req,
        {
          error:
            'token',
        }
      )
    }

    // ========================================================
    // GET DISCORD USER
    // ========================================================

    const userRes =
      await fetch(
        'https://discord.com/api/users/@me',
        {
          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },
        }
      )

    const discordUser =
      await userRes.json()

    if (
      !userRes.ok ||
      !discordUser
        ?.id
    ) {
      console.error(
        'Discord user response:',
        discordUser
      )

      return dashboardRedirect(
        req,
        {
          error:
            'discord_user',
        }
      )
    }

    // ========================================================
    // SAVE CONNECTION
    // ========================================================

    await connectDB()

    await ExamPrepStudent.findByIdAndUpdate(
      auth.student._id,
      {
        $set: {
          discordId:
            String(
              discordUser.id
            ),

          discordUsername:
            String(
              discordUser.username ||
                ''
            ),
        },
      }
    )

    // ========================================================
    // JOIN SERVER + ASSIGN ROLES
    // ========================================================

    try {
      await syncExamPrepStudentDiscordRoles(
        String(
          auth.student._id
        ),
        String(
          discordUser.id
        ),
        String(
          tokenData.access_token
        )
      )
    } catch (
      syncError
    ) {
      console.error(
        'Exam Prep Discord initial role sync:',
        syncError
      )

      /*
       * The account is linked even if Discord temporarily
       * rejects a role operation. The student can use
       * "Re-sync Access" from the dashboard afterwards.
       */
      return dashboardRedirect(
        req,
        {
          connected:
            '1',

          sync:
            'failed',
        }
      )
    }

    return dashboardRedirect(
      req,
      {
        connected:
          '1',
      }
    )
  } catch (
    error
  ) {
    console.error(
      'Exam Prep Discord callback:',
      error
    )

    return dashboardRedirect(
      req,
      {
        error:
          'callback',
      }
    )
  }
}