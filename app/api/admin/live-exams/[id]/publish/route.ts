// app/api/admin/live-exams/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LiveExam from '@/models/LiveExam'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const exam = await LiveExam.findById(id)
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { status: desired } = await req.json()
  if (desired === 'published' && exam.questions.length === 0) {
    return NextResponse.json({ error: 'Add at least one question before publishing' }, { status: 400 })
  }
  exam.status = desired === 'published' ? 'published' : 'draft'
  await exam.save()
  return NextResponse.json({ success: true, status: exam.status })
}