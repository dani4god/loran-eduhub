'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

declare global {
  interface Window { PaystackPop: any }
}

const PLAN_LABELS: Record<string, string> = {
  trial: '1 Week Free Trial',
  monthly: 'Monthly',
  '3months': '3 Months',
  '6months': '6 Months',
  '1year': '1 Year Diploma',
}

interface RegistrationIntent {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  state: string
  dateOfBirth: string
  plan: string
  selections: { courseId: string; tutorId: string; courseName: string; tutorName: string }[]
  amount: number
}

export default function PaymentClient() {
  const router = useRouter()

  const [intent, setIntent] = useState<RegistrationIntent | null>(null)
  const [initData, setInitData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // ── Step 1: Read registration intent from sessionStorage ──
  useEffect(() => {
    const raw = sessionStorage.getItem('registrationIntent')

    if (!raw) {
      setError('No registration data found. Please register again.')
      setInitializing(false)
      return
    }

    let parsed: RegistrationIntent
    try {
      parsed = JSON.parse(raw)
    } catch {
      setError('Invalid registration data. Please register again.')
      setInitializing(false)
      return
    }

    if (!parsed.email || !parsed.plan || !parsed.selections?.length || !parsed.amount) {
      setError('Incomplete registration data. Please register again.')
      setInitializing(false)
      return
    }

    setIntent(parsed)
  }, [])

  // ── Step 2: Initialize Paystack transaction ──
  useEffect(() => {
    if (!intent) return

    setInitializing(true)
    setError('')

    fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: intent.email,
        amount: intent.amount,
        plan: intent.plan,
        selections: intent.selections,
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
  }, [intent])

  // ── Step 3: Open Paystack popup ──
  const handlePay = () => {
    if (!initData || !scriptLoaded || !window.PaystackPop) {
      setError('Payment system not ready. Please wait and try again.')
      return
    }

    setLoading(true)
    setError('')

    const handler = window.PaystackPop.setup({
      key: initData.publicKey,
      email: initData.email,
      amount: Math.round(initData.amount * 100),
      ref: initData.reference,
      currency: 'NGN',
      callback: (response: any) => {
        if (!intent) return

        // Pass registration data to verify endpoint so it can create the account
        const registrationData = encodeURIComponent(
          JSON.stringify({
            email: intent.email,
            password: intent.password,
            firstName: intent.firstName,
            lastName: intent.lastName,
            phone: intent.phone,
            state: intent.state,
            dateOfBirth: intent.dateOfBirth,
            plan: intent.plan,
            selections: intent.selections.map(s => ({
              courseId: s.courseId,
              tutorId: s.tutorId,
            })),
          })
        )

        fetch(
          `/api/payments/verify?reference=${encodeURIComponent(response.reference)}&data=${registrationData}`
        )
          .then(r => r.json())
          .then(d => {
            if (d.success) {
              // Clear all registration data from sessionStorage
              sessionStorage.removeItem('registrationIntent')
              sessionStorage.removeItem('courseTutorSelections')
              router.push(`/payment/success?groupId=${d.groupId}`)
            } else {
              setError(d.error || 'Verification failed. Please contact support.')
              setLoading(false)
            }
          })
          .catch(() => {
            setError(
              `Payment received but verification failed. Contact support with reference: ${response.reference}`
            )
            setLoading(false)
          })
      },
      onClose: () => {
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
            <p className="text-gray-400 text-sm mb-6">
              Your account will be created after payment is confirmed.
            </p>

            {/* Order summary */}
            {intent && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold text-gray-900">
                    {PLAN_LABELS[intent.plan] ?? intent.plan}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Courses</span>
                  <span className="font-semibold text-gray-900">{intent.selections.length}</span>
                </div>
                <div className="space-y-1 pt-1">
                  {intent.selections.map(s => (
                    <p key={s.courseId} className="text-xs text-gray-400">
                      • {s.courseName} <span className="text-gray-300">with {s.tutorName}</span>
                    </p>
                  ))}
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ₦{Number(intent.amount).toLocaleString('en-NG')}
                  </span>
                </div>
              </div>
            )}

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
                  Creating your account...
                </>
              ) : (
                `Pay ₦${Number(intent?.amount ?? 0).toLocaleString('en-NG')} with Paystack`
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