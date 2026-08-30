// app/(public)/self-paced/booking/verify/page.tsx

'use client'

import {
  Suspense,
  useEffect,
  useState,
} from 'react'

import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

import {
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function BookingVerificationContent() {
  const searchParams =
    useSearchParams()

  const router =
    useRouter()

  const [status, setStatus] =
    useState<
      | 'verifying'
      | 'success'
      | 'error'
    >('verifying')

  const [message, setMessage] =
    useState(
      'Confirming your coaching payment...'
    )

  useEffect(() => {
    const reference =
      searchParams.get(
        'reference'
      ) ||
      searchParams.get(
        'trxref'
      )

    if (!reference) {
      setStatus('error')

      setMessage(
        'Payment reference was not provided.'
      )

      return
    }

    let cancelled =
      false

    async function verify() {
      try {
        const res = await fetch(
          `/api/self-paced/booking/verify?reference=${encodeURIComponent(
            reference!
          )}`,
          {
            cache:
              'no-store',
          }
        )

        const data =
          await res.json()

        if (
          !res.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.error ||
              'Booking verification failed'
          )
        }

        if (cancelled) {
          return
        }

        setStatus('success')

        setMessage(
          'Your coaching session has been confirmed.'
        )
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error')

          setMessage(
            `${
              err?.message ||
              'Could not verify your booking'
            } If you were charged, do not pay again. Reference: ${reference}`
          )
        }
      }
    }

    verify()

    return () => {
      cancelled =
        true
    }
  }, [searchParams])

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center px-4">

        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-md w-full shadow-sm">

          {status ===
            'verifying' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />

              <h1 className="text-lg font-bold text-gray-900 mb-2">
                Confirming Booking
              </h1>

              <p className="text-sm text-gray-500">
                {message}
              </p>

              <p className="text-xs text-gray-400 mt-3">
                Please do not refresh or make another payment.
              </p>
            </>
          )}

          {status ===
            'success' && (
            <>
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />

              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h1>

              <p className="text-sm text-gray-500 mb-6">
                {message} Your tutor can now follow up with the session details.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/dashboard/self-paced'
                  )
                }
                className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </>
          )}

          {status ===
            'error' && (
            <>
              <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />

              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Booking Needs Attention
              </h1>

              <p className="text-sm text-red-600 leading-relaxed mb-6">
                {message}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/dashboard/self-paced'
                  )
                }
                className="w-full px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold"
              >
                Return to Dashboard
              </button>
            </>
          )}

        </div>

      </div>

      <Footer />
    </>
  )
}

export default function BookingVerificationPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />

          <div className="min-h-screen bg-gray-50 flex items-center justify-center">

            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />

          </div>

          <Footer />
        </>
      }
    >
      <BookingVerificationContent />
    </Suspense>
  )
}