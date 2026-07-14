// app/api/students/discord/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const student = await Student.findOne({ userId: session.user.id })

  return NextResponse.json({
    discordId: student?.discordId || null,
    discordUsername: student?.discordUsername || null,
    discordRoles: student?.discordRoles || [],
    isConnected: !!student?.discordId,
  })
}