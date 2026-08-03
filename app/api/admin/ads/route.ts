// app/api/admin/ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Advertisement from '@/models/Advertisement'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const ads = await Advertisement.find().sort({ createdAt: -1 })
  return NextResponse.json({ ads })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, message, imageUrl, linkUrl, linkLabel } = await req.json()
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  await connectDB()
  const ad = await Advertisement.create({
    title: title.trim(),
    message: (message || '').trim(),
    imageUrl: imageUrl || null,
    linkUrl: linkUrl || null,
    linkLabel: (linkLabel || 'Learn More').trim(),
    isActive: true,
  })

  return NextResponse.json({ success: true, ad })
}