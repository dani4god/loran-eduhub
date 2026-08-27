// app/api/admin/live-exams/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LiveExam from '@/models/LiveExam'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const exam = await LiveExam.findById(id)
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ exam })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  await connectDB()
  const allowed = ['title', 'description', 'requirements', 'scheduledDate', 'durationMinutes', 'questions']
  const update: any = {}
  for (const f of allowed) if (body[f] !== undefined) update[f] = f === 'scheduledDate' ? new Date(body[f]) : body[f]
  const exam = await LiveExam.findByIdAndUpdate(id, update, { new: true })
  return NextResponse.json({ success: true, exam })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  await LiveExam.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}