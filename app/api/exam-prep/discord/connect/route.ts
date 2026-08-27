// app/api/exam-prep/discord/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const regNumber = searchParams.get('regNumber')
  if (!regNumber) return NextResponse.json({ error: 'regNumber is required' }, { status: 400 })

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/exam-prep/discord/callback`
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds.join',
    state: regNumber, // carries the student's identity through the OAuth round trip
  })

  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params}`)
}