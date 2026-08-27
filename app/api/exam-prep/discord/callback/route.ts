// app/api/exam-prep/discord/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import { syncExamPrepStudentDiscordRoles } from '@/lib/discordSync'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const regNumber = searchParams.get('state')

  if (!code || !regNumber) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/exam-prep/dashboard/discord?error=1`)
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/exam-prep/discord/callback`

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/exam-prep/dashboard/discord?error=1`)
  }

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const discordUser = await userRes.json()

  await connectDB()
  const student = await ExamPrepStudent.findOne({ regNumber })
  if (student) {
    await ExamPrepStudent.findByIdAndUpdate(student._id, {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
    })
    await syncExamPrepStudentDiscordRoles(student._id.toString(), discordUser.id, tokenData.access_token).catch(() => {})
  }

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/exam-prep/dashboard/discord?connected=1`)
}