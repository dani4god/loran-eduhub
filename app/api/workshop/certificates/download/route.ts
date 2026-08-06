// app/api/workshop/certificates/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import WorkshopCertificateBatch from '@/models/WorkshopCertificateBatch'
import WorkshopCertificateIssue from '@/models/WorkshopCertificateIssue'
import { generateWorkshopCertNumber } from '@/lib/workshop'
import { renderWorkshopCertificatePdf } from '@/lib/workshopCertificatePdf'

export async function POST(req: NextRequest) {
  try {
    const { code, fullName } = await req.json()

    if (!code?.trim() || !fullName?.trim()) {
      return NextResponse.json({ error: 'Code and full name are required' }, { status: 400 })
    }

    await connectDB()

    const batch = await WorkshopCertificateBatch.findOne({ code: code.trim(), isActive: true })
    if (!batch) {
      return NextResponse.json({ error: 'Invalid or inactive code' }, { status: 404 })
    }

    const certificateNumber = generateWorkshopCertNumber()
    const issuedAt = new Date()

    await WorkshopCertificateIssue.create({
      batchId: batch._id,
      fullName: fullName.trim(),
      certificateNumber,
      issuedAt,
    })

    // app/api/workshop/certificates/download/route.ts — inside the POST handler, update the renderWorkshopCertificatePdf call:

    const pdfBuffer = await renderWorkshopCertificatePdf({
      fullName: fullName.trim(),
      workshopTitle: batch.title,
      themeImageUrl: batch.themeImageUrl,
      logoUrl: batch.logoUrl,
      signatureUrl: batch.signatureUrl,
      convenerName: batch.convenerName,
      certificateNumber,
      issuedAt,
    })

    const pdfData = new Uint8Array(pdfBuffer)

    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificateNumber}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Workshop certificate download error:', error)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}