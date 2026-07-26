// app/api/tutor/profile/route.ts
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
  const tutor = await Tutor.findOne({ userId: session.user.id })
    .select('firstName lastName bio profileImage phone courses')
    .populate('courses', 'name category')

  return NextResponse.json({ tutor })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bio, profileImage, phone } = await req.json()

  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  if (bio !== undefined) {
    if (bio.trim().length < 50) {
      return NextResponse.json({ error: 'Bio must be at least 50 characters' }, { status: 400 })
    }
    tutor.bio = bio.trim()
  }
  if (profileImage !== undefined) tutor.profileImage = profileImage
  if (phone !== undefined) tutor.phone = phone.trim()

  await tutor.save()

  return NextResponse.json({ success: true })
}