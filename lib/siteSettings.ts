// lib/siteSettings.ts
import connectDB from '@/lib/mongodb'
import PlatformSettings from '@/models/PlatformSettings'

export async function getSiteSettings() {
  await connectDB()
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { commissionRate: 0.15, maintenanceMode: false } },
    { upsert: true, new: true }
  )
  return {
    logoUrl: settings.logoUrl || null,
    maintenanceMode: settings.maintenanceMode,
  }
}