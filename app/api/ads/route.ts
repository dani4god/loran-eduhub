// app/api/ads/route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Advertisement from '@/models/Advertisement'

export async function GET() {
  await connectDB()
  const ads = await Advertisement.find({ isActive: true }).sort({ createdAt: -1 }).limit(5)
  return NextResponse.json({
    ads: ads.map((a: any) => ({
      _id: a._id.toString(),
      title: a.title,
      message: a.message,
      imageUrl: a.imageUrl,
      linkUrl: a.linkUrl,
      linkLabel: a.linkLabel,
    })),
  })
}