// app/api/tutors/discord/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'

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
    discordRoles: tutor?.discordRoles || [],
    isConnected: !!tutor?.discordId,
  })
}