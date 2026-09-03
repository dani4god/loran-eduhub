// app/api/exam-prep/discord/connect/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireExamPrepStudent,
} from '@/lib/examPrepAuth'

import {
  hasExamPrepCommunityAccess,
} from '@/lib/discordSync'

import {
  createExamPrepDiscordOAuthState,
  EXAM_PREP_DISCORD_OAUTH_COOKIE,
} from '@/lib/examPrepDiscordOAuth'

// ============================================================
// GET
// ============================================================

export async function GET(
  req:
    NextRequest
) {
  try {
    // ========================================================
    // AUTHENTICATE EXAM PREP STUDENT
    // ========================================================

    const auth =
      await requireExamPrepStudent(
        req
      )

    if (
      !auth.ok
    ) {
      const loginUrl =
        new URL(
          '/exam-prep/login',
          req.nextUrl.origin
        )

      loginUrl.searchParams.set(
        'next',
        '/exam-prep/dashboard/discord'
      )

      return NextResponse.redirect(
        loginUrl
      )
    }

    // ========================================================
    // SUBSCRIPTION ACCESS
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
      const subscriptionUrl =
        new URL(
          '/exam-prep/dashboard/subscription',
          req.nextUrl.origin
        )

      subscriptionUrl.searchParams.set(
        'from',
        'discord'
      )

      return NextResponse.redirect(
        subscriptionUrl
      )
    }

    // ========================================================
    // CONFIG
    // ========================================================

    const clientId =
      process.env
        .DISCORD_CLIENT_ID

    if (
      !clientId
    ) {
      throw new Error(
        'DISCORD_CLIENT_ID is not configured.'
      )
    }

    const appUrl =
      process.env
        .NEXTAUTH_URL ||
      req.nextUrl.origin

    const redirectUri =
      `${appUrl}/api/exam-prep/discord/callback`

    // ========================================================
    // SECURE STATE
    // ========================================================

    const {
      state,
      nonce,
    } =
      createExamPrepDiscordOAuthState(
        String(
          auth.student._id
        )
      )

    // ========================================================
    // DISCORD URL
    // ========================================================

    const params =
      new URLSearchParams({
        client_id:
          clientId,

        redirect_uri:
          redirectUri,

        response_type:
          'code',

        scope:
          'identify guilds.join',

        state,
      })

    const discordUrl =
      `https://discord.com/api/oauth2/authorize?${params.toString()}`

    const response =
      NextResponse.redirect(
        discordUrl
      )

    // ========================================================
    // STATE COOKIE
    // ========================================================

    response.cookies.set({
      name:
        EXAM_PREP_DISCORD_OAUTH_COOKIE,

      value:
        nonce,

      httpOnly:
        true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite:
        'lax',

      path:
        '/',

      maxAge:
        10 * 60,
    })

    return response
  } catch (
    error
  ) {
    console.error(
      'Exam Prep Discord connect:',
      error
    )

    const errorUrl =
      new URL(
        '/exam-prep/dashboard/discord',
        req.nextUrl.origin
      )

    errorUrl.searchParams.set(
      'error',
      'connect'
    )

    return NextResponse.redirect(
      errorUrl
    )
  }
}