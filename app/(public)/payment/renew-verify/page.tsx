import { Suspense } from 'react'
import PaymentRenewVerifyClient from './PaymentRenewVerifyClient'

export default function PaymentRenewVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-3">Loading...</p>
        </div>
      </div>
    }>
      <PaymentRenewVerifyClient />
    </Suspense>
  )
}