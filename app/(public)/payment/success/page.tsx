// app/(public)/payment/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')
  const [showCelebration, setShowCelebration] = useState(true)

  useEffect(() => {
    setTimeout(() => setShowCelebration(false), 3000)

    if (reference) {
      fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
    }
  }, [reference])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center relative">
        {/* Floating Emojis */}
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {['🎉', '🎊', '✨', '🌟', '💫', '⭐', '🪅'].map((emoji, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  top: '50%',
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        )}

        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h1>
        <p className="text-gray-600 mb-6">
          Your enrollment has been confirmed. You now have access to your courses.
        </p>

        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-tutor text-white rounded-xl font-semibold hover:bg-tutor/90 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}