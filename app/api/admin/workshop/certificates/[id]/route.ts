// app/api/admin/workshop/certificates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import WorkshopCertificateBatch from '@/models/WorkshopCertificateBatch'

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

  const batch = await WorkshopCertificateBatch.findByIdAndUpdate(id, { isActive }, { new: true })
  if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
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
  await WorkshopCertificateBatch.findByIdAndDelete(id)

  return NextResponse.json({ success: true })
}