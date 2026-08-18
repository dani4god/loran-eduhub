// app/api/self-paced/discord/sync/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import User from '@/models/User'
import { syncSelfPacedStudentDiscordRoles } from '@/lib/discordSync'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student?.discordId) {
    return NextResponse.json({ error: 'Discord not connected yet' }, { status: 400 })
  }

  const user = await User.findById(session.user.id).select('discordAccessToken')
  const roles = await syncSelfPacedStudentDiscordRoles(student._id.toString(), student.discordId, user?.discordAccessToken)

  return NextResponse.json({ success: true, assignedRoles: roles })
}