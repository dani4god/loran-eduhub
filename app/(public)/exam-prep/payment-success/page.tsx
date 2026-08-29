import {
  Suspense,
} from 'react'

import PaymentSuccessClient from './PaymentSuccessClient'

function LoadingPayment() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-md w-full">

        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

        <h1 className="text-lg font-bold text-gray-900">
          Confirming Payment
        </h1>

        <p className="text-sm text-gray-500 mt-2">
          Please wait while we confirm your Paystack payment.
        </p>

      </div>

    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <LoadingPayment />
      }
    >
      <PaymentSuccessClient />
    </Suspense>
  )
}