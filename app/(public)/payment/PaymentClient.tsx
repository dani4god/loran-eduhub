'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

declare global {
  interface Window {
    PaystackPop: any
  }
}

const PLAN_LABELS: Record<string, string> = {
  trial: '1 Week Free Trial',
  '3months': '3 Months',
  '6months': '6 Months',
  '1year': '1 Year Diploma',
}

interface PaymentData {
  studentId: string
  plan: string
  enrollmentIds: string[]
  amount: number
  groupId?: string | null
}

export default function PaymentClient() {
  const router = useRouter()

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [initData, setInitData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // ── Step 1: Read payment data from sessionStorage ──
  useEffect(() => {
    const raw = sessionStorage.getItem('paymentData')

    if (!raw) {
      setError('No payment data found. Please register again.')
      setInitializing(false)
      return
    }

    let parsed: PaymentData
    try {
      parsed = JSON.parse(raw)
    } catch {
      setError('Invalid payment data. Please register again.')
      setInitializing(false)
      return
    }

    if (
      !parsed.studentId ||
      !parsed.plan ||
      !parsed.enrollmentIds?.length ||
      !parsed.amount
    ) {
      setError('Incomplete payment data. Please register again.')
      setInitializing(false)
      return
    }

    setPaymentData(parsed)
  }, [])

  // ── Step 2: Initialize payment with backend once we have paymentData ──
  useEffect(() => {
    if (!paymentData) return

    setInitializing(true)
    setError('')

    fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: paymentData.studentId,
        plan: paymentData.plan,
        enrollmentIds: paymentData.enrollmentIds,
        amount: paymentData.amount,
        groupId: paymentData.groupId ?? null,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error)
        } else {
          setInitData(d)
        }
      })
      .catch(() => setError('Could not initialize payment. Please try again.'))
      .finally(() => setInitializing(false))
  }, [paymentData])

  // ── Step 3: Open Paystack popup ──
  const handlePay = () => {
    if (!initData || !scriptLoaded) {
      setError('Payment system not ready. Please wait a moment and try again.')
      return
    }

    if (!window.PaystackPop) {
      setError('Paystack failed to load. Please refresh the page.')
      return
    }

    setLoading(true)
    setError('')

    const handler = window.PaystackPop.setup({
      key: initData.publicKey,
      email: initData.email,
      amount: Math.round(initData.amount * 100), // kobo
      ref: initData.reference,
      currency: 'NGN',
      callback: function (response: any) {
        // Verify on backend
        fetch(`/api/payments/verify?reference=${encodeURIComponent(response.reference)}`)
          .then(r => r.json())
          .then(d => {
            if (d.success) {
              sessionStorage.removeItem('paymentData')
              sessionStorage.removeItem('courseTutorSelections')
              router.push(`/payment/success?groupId=${d.groupId}`)
            } else {
              setError(d.error || 'Payment verification failed. Please contact support.')
              setLoading(false)
            }
          })
          .catch(() => {
            setError(
              `Payment received but verification failed. Please contact support with reference: ${response.reference}`
            )
            setLoading(false)
          })
      },
      onClose: function () {
        setLoading(false)
      },
    })

    handler.openIframe()
  }

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

            <h1 className="font-bold text-xl text-gray-900 mb-1">Complete Your Payment</h1>
            <p className="text-gray-400 text-sm mb-6">Secure checkout powered by Paystack</p>

            {/* Order summary */}
            {paymentData && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold text-gray-900">
                    {PLAN_LABELS[paymentData.plan] ?? paymentData.plan}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Courses</span>
                  <span className="font-semibold text-gray-900">
                    {paymentData.enrollmentIds.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2.5 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ₦{Number(paymentData.amount).toLocaleString('en-NG')}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <p>{error}</p>
                {error.includes('register again') && (
                  <Link
                    href="/auth/student/register"
                    className="mt-2 inline-block underline font-semibold"
                  >
                    Go back to registration
                  </Link>
                )}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={loading || initializing || !initData || !!error}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {initializing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Preparing payment...
                </>
              ) : loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Pay ₦{Number(paymentData?.amount ?? 0).toLocaleString('en-NG')} with Paystack
                </>
              )}
            </button>

            <p className="text-center text-gray-400 text-xs mt-4">
              <Link href="/auth/student/register" className="hover:underline">
                Cancel and go back
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}