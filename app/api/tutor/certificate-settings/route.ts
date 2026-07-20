// app/api/tutor/certificate-settings/route.ts
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
  const tutor = await Tutor.findOne({ userId: session.user.id }).select(
    'certificateSignatureUrl certificateLogoUrl'
  )

  return NextResponse.json({
    signatureUrl: tutor?.certificateSignatureUrl || null,
    logoUrl: tutor?.certificateLogoUrl || null,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const { signatureUrl, logoUrl } = await req.json()

  if (signatureUrl !== undefined) tutor.certificateSignatureUrl = signatureUrl
  if (logoUrl !== undefined) tutor.certificateLogoUrl = logoUrl
  await tutor.save()

  return NextResponse.json({
    success: true,
    signatureUrl: tutor.certificateSignatureUrl,
    logoUrl: tutor.certificateLogoUrl,
  })
}