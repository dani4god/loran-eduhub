// lib/siteSettings.ts
import connectDB from '@/lib/mongodb'
import PlatformSettings from '@/models/PlatformSettings'

let cache: { data: any; expiresAt: number } | null = null
const CACHE_TTL_MS = 15000 // 15s — short enough that admin changes still land quickly

export async function getSiteSettings() {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data
  }

  await connectDB()
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { commissionRate: 0.15, maintenanceMode: false } },
    { upsert: true, returnDocument: 'after' } // also fixes the Mongoose deprecation warning in your logs
  )

  const data = {
    logoUrl: settings.logoUrl || null,
    maintenanceMode: settings.maintenanceMode,
    heroImageUrls: settings.heroImageUrls || [],
    certificateSignatureUrl: settings.certificateSignatureUrl || null,
    certificateLogoUrl: settings.certificateLogoUrl || null,
  }

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS }
  return data
}

// Call this from the admin settings PATCH route so a change (e.g. toggling
// maintenance mode) doesn't wait out the full cache TTL before taking effect.
export function invalidateSiteSettingsCache() {
  cache = null
}