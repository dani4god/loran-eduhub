// app/api/exam-prep/discord/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const regNumber = searchParams.get('regNumber')
  await connectDB()
  const student = await ExamPrepStudent.findOne({ regNumber })
  return NextResponse.json({
    discordUsername: student?.discordUsername || null,
    discordRoles: student?.discordRoles || [],
    isConnected: !!student?.discordId,
  })
}