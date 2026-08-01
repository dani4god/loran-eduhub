// components/layout/Logo.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Logo({ className = '' }: { className?: string }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((d) => setLogoUrl(d.logoUrl))
      .catch(() => {})
  }, [])

  return (
    <Link href="/" className={`flex items-center gap-2 group shrink-0 ${className}`}>
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt="Loran EduHub"
          className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-lg"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-heading font-bold text-sm">L</span>
        </div>
      )}
      <span className="font-heading font-bold text-base sm:text-lg text-white whitespace-nowrap">
        Loran <span className="text-blue-400">EduHub</span>
      </span>
    </Link>
  )
}