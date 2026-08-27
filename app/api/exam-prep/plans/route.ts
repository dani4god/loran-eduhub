import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamPrepSettings from '@/models/ExamPrepSettings'

export async function GET() {
  await connectDB()
  const settings = await ExamPrepSettings.findOne({ key: 'global' })
  return NextResponse.json({ plans: (settings?.plans || []).filter((p: any) => p.enabled) })
}