// app/api/discord/sync-student/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import User from '@/models/User'
import { syncStudentDiscordRoles } from '@/lib/discordSync'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.discordId) {
      return NextResponse.json({
        error: 'Discord not connected. Please connect your Discord account first.',
      }, { status: 400 })
    }

    const user = await User.findById(student.userId).select('discordAccessToken')
    if (!user?.discordAccessToken) {
      return NextResponse.json({
        error: 'Discord access token missing. Please reconnect Discord.',
      }, { status: 400 })
    }

    const assignedRoles = await syncStudentDiscordRoles(
      student._id.toString(),
      student.discordId,
      user.discordAccessToken
    )

    return NextResponse.json({
      success: true,
      message: 'Synced to Discord server successfully',
      assignedRoles,
      missingRoles: [],
    })
  } catch (error: any) {
    console.error('Student sync error:', error)
    return NextResponse.json({ error: error.message || 'Failed to sync' }, { status: 500 })
  }
}