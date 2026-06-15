// app/(public)/payment/success/page.tsx
import { Suspense } from 'react'
import PaymentSuccessClient from './PaymentSuccessClient'

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-tutor border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-3">Loading payment confirmation...</p>
        </div>
      </div>
    }>
      <PaymentSuccessClient />
    </Suspense>
  )
}