// app/api/site-settings/route.ts
import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/siteSettings'

export async function GET() {
  try {
    const settings = await getSiteSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('site-settings error:', error)
    // Fail safe with sane defaults rather than a 500 — this is what stops
    // a transient Mongo hiccup from cascading into broken pages/proxy loops.
    return NextResponse.json({
      logoUrl: null,
      maintenanceMode: false,
      heroImageUrls: [],
      certificateSignatureUrl: null,
      certificateLogoUrl: null,
    })
  }
}