'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

import {
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export default function PaymentSuccessClient() {
  const router =
    useRouter()

  const searchParams =
    useSearchParams()

  const started =
    useRef(false)

  const [
    status,
    setStatus,
  ] = useState<
    | 'verifying'
    | 'success'
    | 'failed'
  >('verifying')

  const [
    message,
    setMessage,
  ] = useState(
    'Confirming your payment...'
  )

  useEffect(() => {
    /**
     * Prevent duplicate verification caused by
     * React Strict Mode in development.
     */
    if (started.current) {
      return
    }

    started.current =
      true

    const reference =
      searchParams.get(
        'reference'
      ) ||
      searchParams.get(
        'trxref'
      )

    if (!reference) {
      setStatus('failed')

      setMessage(
        'Paystack did not return a payment reference.'
      )

      return
    }

    const verify =
      async () => {
        try {
          const response =
            await fetch(
              `/api/exam-prep/subscribe/verify?reference=${encodeURIComponent(
                reference
              )}`,
              {
                cache:
                  'no-store',
              }
            )

          const data =
            await response.json()

          if (
            !response.ok ||
            !data.success
          ) {
            setStatus(
              'failed'
            )

            setMessage(
              data.error ||
                'Payment could not be verified.'
            )

            return
          }

          /**
           * ONLY now, after Paystack verification,
           * save the student's registration number.
           */
          localStorage.setItem(
            'examPrepRegNumber',
            data.regNumber
          )

          setStatus(
            'success'
          )

          setMessage(
            'Payment confirmed. Your Exam Prep subscription is now active.'
          )

          setTimeout(() => {
            router.replace(
              '/exam-prep/dashboard/take'
            )
          }, 1500)
        } catch (
          error
        ) {
          console.error(
            'Exam Prep payment verification failed:',
            error
          )

          setStatus(
            'failed'
          )

          setMessage(
            `We could not confirm your payment right now. Do not pay again. Your reference is ${reference}.`
          )
        }
      }

    verify()
  }, [
    router,
    searchParams,
  ])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">

        {status ===
          'verifying' && (
          <>
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />

            <h1 className="text-xl font-bold text-gray-900">
              Confirming Payment
            </h1>
          </>
        )}

        {status ===
          'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />

            <h1 className="text-xl font-bold text-gray-900">
              Payment Successful
            </h1>
          </>
        )}

        {status ===
          'failed' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

            <h1 className="text-xl font-bold text-gray-900">
              Payment Confirmation Problem
            </h1>
          </>
        )}

        <p className="text-sm text-gray-500 mt-3">
          {message}
        </p>

        {status ===
          'success' && (
          <p className="text-xs text-gray-400 mt-3">
            Taking you to your Exam Prep dashboard...
          </p>
        )}

        {status ===
          'failed' && (
          <button
            onClick={() =>
              router.push(
                '/exam-prep/take'
              )
            }
            className="mt-6 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl"
          >
            Return to Exam Prep
          </button>
        )}

      </div>

    </div>
  )
}