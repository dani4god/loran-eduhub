// app/api/admin/workshop/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import WorkshopContent from '@/models/WorkshopContent'
import { DEFAULT_WORKSHOP_CONTENT } from '@/lib/workshop'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const content = await WorkshopContent.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: DEFAULT_WORKSHOP_CONTENT },
    { upsert: true, new: true }
  )

  return NextResponse.json({ content })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { heading, subheading, speakers, advertImages, discordInviteLink } = await req.json()

  await connectDB()

  const update: any = {}
  if (heading !== undefined) update.heading = heading
  if (subheading !== undefined) update.subheading = subheading
  if (speakers !== undefined) update.speakers = speakers
  if (advertImages !== undefined) update.advertImages = advertImages
  if (discordInviteLink !== undefined) update.discordInviteLink = discordInviteLink

  const content = await WorkshopContent.findOneAndUpdate({ key: 'main' }, update, { upsert: true, new: true })

  return NextResponse.json({ success: true, content })
}