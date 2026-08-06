// app/api/workshop/route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import WorkshopContent from '@/models/WorkshopContent'
import { DEFAULT_WORKSHOP_CONTENT } from '@/lib/workshop'

export async function GET() {
  await connectDB()
  const content = await WorkshopContent.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: DEFAULT_WORKSHOP_CONTENT },
    { upsert: true, new: true }
  )

  return NextResponse.json({
    heading: content.heading,
    subheading: content.subheading,
    speakers: content.speakers,
    advertImages: content.advertImages,
    discordInviteLink: content.discordInviteLink || process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK || '',
  })
}