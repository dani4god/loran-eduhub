// app/api/tutor/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id }).select('pricing')

  return NextResponse.json({ pricing: tutor?.pricing || null })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const body = await req.json()
  const { monthly, threeMonths, sixMonths, oneYear } = body

  const values = { monthly, threeMonths, sixMonths, oneYear }
  const invalid = Object.entries(values).find(
    ([, v]) => typeof v !== 'number' || v <= 0
  )

  if (invalid) {
    return NextResponse.json(
      { error: 'Please enter a price greater than 0 for all four plans' },
      { status: 400 }
    )
  }

  tutor.pricing = { monthly, threeMonths, sixMonths, oneYear }
  await tutor.save()

  return NextResponse.json({ success: true, pricing: tutor.pricing })
}