// app/api/tutor/contract/status/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import TutorContractAck from '@/models/TutorContractAck'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  const ack = await TutorContractAck.findOne({ tutorId: tutor._id })
  return NextResponse.json({ acknowledged: !!ack })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  await TutorContractAck.findOneAndUpdate(
    { tutorId: tutor._id },
    { acknowledgedAt: new Date() },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}