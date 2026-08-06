// app/api/admin/workshop/certificates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import WorkshopCertificateBatch from '@/models/WorkshopCertificateBatch'
import WorkshopCertificateIssue from '@/models/WorkshopCertificateIssue'
import { generate12DigitCode } from '@/lib/workshop'

export async function GET(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const batches = await WorkshopCertificateBatch.find().sort({ createdAt: -1 })

  const results = await Promise.all(
    batches.map(async (b: any) => ({
      _id: b._id.toString(),
      title: b.title,
      code: b.code,
      themeImageUrl: b.themeImageUrl,
      logoUrl: b.logoUrl,
      isActive: b.isActive,
      createdAt: b.createdAt,
      issuedCount: await WorkshopCertificateIssue.countDocuments({ batchId: b._id }),
    }))
  )

  return NextResponse.json({ batches: results })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, themeImageUrl, logoUrl } = await req.json()
  if (!title?.trim() || !themeImageUrl || !logoUrl) {
    return NextResponse.json({ error: 'Title, theme image, and logo are required' }, { status: 400 })
  }

  await connectDB()

  let code = generate12DigitCode()
  // Extremely unlikely to collide, but guard against it anyway.
  while (await WorkshopCertificateBatch.findOne({ code })) {
    code = generate12DigitCode()
  }

  const batch = await WorkshopCertificateBatch.create({
    title: title.trim(),
    code,
    themeImageUrl,
    logoUrl,
    isActive: true,
  })

  return NextResponse.json({ success: true, batch })
}