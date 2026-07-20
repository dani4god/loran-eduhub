// app/(public)/payment/success/PaymentSuccessClient.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')
  const [showCelebration, setShowCelebration] = useState(true)

  // Load confetti and trigger celebration
  useEffect(() => {
    // Trigger celebration effect
    setTimeout(() => setShowCelebration(false), 4000)

    // Verify payment
    if (reference) {
      fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      }).catch(console.error)
    }
  }, [reference])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center relative">
        {/* Floating Emojis Celebration */}
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {['🎉', '🎊', '✨', '🌟', '💫', '⭐', '🪅', '🎈', '🏆', '🥳'].map((emoji, i) => (
              <div
                key={i}
                className="absolute text-2xl md:text-3xl animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  top: '50%',
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        )}

        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">
          Payment Successful! 🎉
        </h1>

        <p className="text-gray-600 mb-6 relative z-10">
          Your enrollment has been confirmed. You now have access to your courses.
        </p>

        <Link
          href="/auth/student/login"
          className="inline-block px-6 py-3 bg-gradient-to-r from-tutor to-brand-primary text-white rounded-xl font-semibold hover:shadow-lg transition relative z-10"
        >
          Login to Dashboard
        </Link>

        <p className="text-xs text-gray-500 mt-4 relative z-10">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  )
}