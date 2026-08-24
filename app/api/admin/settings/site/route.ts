// app/api/admin/settings/site/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import PlatformSettings from '@/models/PlatformSettings'
import { invalidateSiteSettingsCache } from '@/lib/siteSettings'

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { 
    logoUrl, 
    maintenanceMode, 
    heroImageUrls,
    certificateSignatureUrl,
    certificateLogoUrl 
  } = await req.json()
  
  await connectDB()

  const update: any = {}
  if (logoUrl !== undefined) update.logoUrl = logoUrl
  if (maintenanceMode !== undefined) update.maintenanceMode = maintenanceMode
  if (heroImageUrls !== undefined) update.heroImageUrls = heroImageUrls
  if (certificateSignatureUrl !== undefined) update.certificateSignatureUrl = certificateSignatureUrl
  if (certificateLogoUrl !== undefined) update.certificateLogoUrl = certificateLogoUrl

  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    update,
    { upsert: true, new: true }
  )
  invalidateSiteSettingsCache()
  
  return NextResponse.json({ 
    success: true, 
    logoUrl: settings.logoUrl, 
    maintenanceMode: settings.maintenanceMode, 
    heroImageUrls: settings.heroImageUrls,
    certificateSignatureUrl: settings.certificateSignatureUrl,
    certificateLogoUrl: settings.certificateLogoUrl,
    updatedAt: settings.updatedAt 
  })
}