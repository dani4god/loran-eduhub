// app/api/admin/ads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Advertisement from '@/models/Advertisement'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { isActive } = await req.json()
  await connectDB()

  const ad = await Advertisement.findByIdAndUpdate(id, { isActive }, { new: true })
  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })

  return NextResponse.json({ success: true, ad })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const ad = await Advertisement.findByIdAndDelete(id)
  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}