// app/api/tutor/social/route.ts
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
  const tutor = await Tutor.findOne({ userId: session.user.id }).select('socialLinks campaignMessages slug')
  return NextResponse.json({
    socialLinks: tutor?.socialLinks || [],
    campaignMessages: (tutor?.campaignMessages || []).slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    slug: tutor?.slug,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { socialLinks } = await req.json()
  if (!Array.isArray(socialLinks)) {
    return NextResponse.json({ error: 'socialLinks must be an array' }, { status: 400 })
  }
  await connectDB()
  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

  tutor.socialLinks = socialLinks.filter((l: any) => l.label?.trim() && l.url?.trim())
    .map((l: any) => ({ label: l.label.trim(), url: l.url.trim() }))
  await tutor.save()

  return NextResponse.json({ success: true, socialLinks: tutor.socialLinks })
}