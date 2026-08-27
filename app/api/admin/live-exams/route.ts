// app/api/admin/live-exams/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LiveExam from '@/models/LiveExam'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const exams = await LiveExam.find().sort({ scheduledDate: -1 })
  return NextResponse.json({ exams })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, description, requirements, scheduledDate, durationMinutes } = await req.json()
  if (!title?.trim() || !scheduledDate) return NextResponse.json({ error: 'Title and scheduled date are required' }, { status: 400 })
  await connectDB()
  const exam = await LiveExam.create({ title: title.trim(), description, requirements, scheduledDate: new Date(scheduledDate), durationMinutes: durationMinutes || 60, questions: [], status: 'draft' })
  return NextResponse.json({ success: true, examId: exam._id.toString() })
}