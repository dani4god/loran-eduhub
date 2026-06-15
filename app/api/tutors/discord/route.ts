// app/api/tutors/discord/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import { getBotGuilds, getGuildRoles } from '@/lib/discord'

// GET: current tutor's Discord connection status
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })

  return NextResponse.json({
    discordId: tutor?.discordId || null,
    discordUsername: tutor?.discordUsername || null,
    discordServerId: tutor?.discordServerId || null,
    discordInviteLink: tutor?.discordInviteLink || null,
    isConnected: !!tutor?.discordId,
  })
}

// POST: tutor submits their Discord server (guild) ID
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { serverId } = await req.json()
  if (!serverId || typeof serverId !== 'string') {
    return NextResponse.json({ error: 'Server ID is required' }, { status: 400 })
  }

  await connectDB()

  // Verify the bot is actually in this server
  let botGuilds: any[]
  try {
    botGuilds = await getBotGuilds()
  } catch (err: any) {
    return NextResponse.json(
      { error: `Could not reach Discord API: ${err.message}` },
      { status: 502 }
    )
  }

  const isBotInGuild = botGuilds.some((g: any) => g.id === serverId)
  if (!isBotInGuild) {
    return NextResponse.json(
      { error: 'Loran bot is not in that server. Please invite the bot first.' },
      { status: 400 }
    )
  }

  // Fetch roles so the tutor can see what's available (optional sanity check)
  const roles = await getGuildRoles(serverId)
  const roleNames = roles.map((r: any) => r.name)

  await Tutor.findOneAndUpdate(
    { userId: session.user.id },
    { discordServerId: serverId }
  )

  return NextResponse.json({
    success: true,
    serverId,
    availableRoles: roleNames,
  })
}