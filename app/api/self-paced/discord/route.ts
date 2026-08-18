// app/api/self-paced/discord/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })

  return NextResponse.json({
    discordUsername: student?.discordUsername || null,
    discordRoles: student?.discordRoles || [],
    isConnected: !!student?.discordId,
  })
}