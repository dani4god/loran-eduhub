// components/layout/Logo.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Logo({ className = '' }: { className?: string }) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link href="/" className={`flex items-center gap-2 group shrink-0 ${className}`}>
      {!imgError ? (
        <img
          src="/logo.png"
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