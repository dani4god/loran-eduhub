// app/api/exam-prep/discord/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepStudent from '@/models/ExamPrepStudent'
import { syncExamPrepStudentDiscordRoles } from '@/lib/discordSync'

export async function POST(req: NextRequest) {
  const { regNumber } = await req.json()
  await connectDB()
  const student = await ExamPrepStudent.findOne({ regNumber })
  if (!student?.discordId) return NextResponse.json({ error: 'Discord not connected yet' }, { status: 400 })
  const roles = await syncExamPrepStudentDiscordRoles(student._id.toString(), student.discordId)
  return NextResponse.json({ success: true, assignedRoles: roles })
}