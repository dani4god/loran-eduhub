'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { verifyWithRetry } from '@/lib/verifyWithRetry'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    PaystackPop: any
  }
}

export default function ExamPrepLoginPage() {
  const router = useRouter()

  const [regNumber, setRegNumber] = useState('')
  const [forgotName, setForgotName] = useState('')
  const [matches, setMatches] = useState<any[]>([])
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [plans, setPlans] = useState<any[]>([])
  const [showPlans, setShowPlans] = useState(false)

  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const [paystackLoaded, setPaystackLoaded] = useState(false)

  /**
   * Load Paystack and verify that the student has access.
   */
  const login = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!regNumber.trim()) {
      setError('Enter your registration number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/exam-prep/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regNumber: regNumber.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unable to continue')
        setLoading(false)
        return
      }

      if (data.requiresPayment) {
        const plansRes = await fetch('/api/exam-prep/plans')
        const plansData = await plansRes.json()

        setPlans(plansData.plans || [])
        setShowPlans(true)
        setLoading(false)
        return
      }

      localStorage.setItem(
        'examPrepRegNumber',
        data.student.regNumber
      )

      router.push('/exam-prep/dashboard/take')
    } catch (err) {
      console.error('Exam prep login error:', err)

      setError(
        'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verify the Paystack transaction.
   *
   * Your existing endpoint:
   * /api/exam-prep/subscribe/verify?reference=...
   */
  const verifyPayment = async (reference: string) => {
    console.log(
      '[Paystack] Verifying transaction:',
      reference
    )

    try {
      const data = await verifyWithRetry(
        `/api/exam-prep/subscribe/verify?reference=${encodeURIComponent(
          reference
        )}`
      )

      console.log(
        '[Paystack] Verification response:',
        data
      )

      if (data.success) {
        localStorage.setItem(
          'examPrepRegNumber',
          regNumber.trim()
        )

        router.push('/exam-prep/dashboard/take')

        return true
      }

      return false
    } catch (err) {
      console.error(
        '[Paystack] Verification error:',
        err
      )

      return false
    }
  }

  /**
   * Poll Paystack verification after the popup opens.
   *
   * This is useful with resumeTransaction() because the
   * transaction itself was initialized on the server.
   */
  const pollPaymentStatus = async (
    reference: string
  ) => {
    const maxAttempts = 60
    const interval = 2000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(
        `[Paystack] Verification attempt ${
          attempt + 1
        }/${maxAttempts}`
      )

      const successful = await verifyPayment(reference)

      if (successful) {
        setSubscribing(false)
        return
      }

      await new Promise((resolve) =>
        setTimeout(resolve, interval)
      )
    }

    console.warn(
      '[Paystack] Payment verification timed out'
    )

    setError(
      'We could not confirm the payment yet. Please check your payment status before trying again.'
    )

    setSubscribing(false)
  }

  /**
   * Start payment.
   *
   * Backend initializes the transaction and returns:
   *
   * accessCode
   * authorizationUrl
   * reference
   * publicKey
   * amount
   */
  const subscribe = async (
    e: React.FormEvent,
    duration: string
  ) => {
    e.preventDefault()

    if (!email.trim()) {
      setError(
        'Enter your email to receive a receipt'
      )
      return
    }

    setError('')
    setSubscribing(true)

    try {
      /*
       * Make sure Paystack's V2 script has loaded.
       */
      if (!paystackLoaded || !window.PaystackPop) {
        console.warn(
          '[Paystack] Script not ready yet'
        )

        setError(
          'Payment system is still loading. Please wait a moment and try again.'
        )

        setSubscribing(false)
        return
      }

      console.log(
        '[Paystack] Initializing payment...'
      )

      const res = await fetch(
        '/api/exam-prep/subscribe',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            regNumber: regNumber.trim(),
            duration,
            email: email.trim(),
          }),
        }
      )

      const data = await res.json()

      console.log(
        '[Paystack] Backend response:',
        data
      )

      if (!res.ok) {
        setError(
          data.error ||
            'Failed to initialize payment'
        )

        setSubscribing(false)
        return
      }

      /*
       * If the plan doesn't require payment,
       * grant access immediately.
       */
      if (!data.requiresPayment) {
        localStorage.setItem(
          'examPrepRegNumber',
          regNumber.trim()
        )

        router.push('/exam-prep/dashboard/take')

        return
      }

      /*
       * The backend must return an accessCode.
       */
      if (!data.accessCode) {
        console.error(
          '[Paystack] Missing accessCode:',
          data
        )

        setError(
          'Payment was initialized incorrectly. No Paystack access code was returned.'
        )

        setSubscribing(false)
        return
      }

      /*
       * The backend must also return a reference.
       */
      if (!data.reference) {
        console.error(
          '[Paystack] Missing transaction reference:',
          data
        )

        setError(
          'Payment was initialized incorrectly. No transaction reference was returned.'
        )

        setSubscribing(false)
        return
      }

      console.log(
        '[Paystack] Access code:',
        data.accessCode
      )

      console.log(
        '[Paystack] Reference:',
        data.reference
      )

      /*
       * Create the Paystack V2 popup.
       */
      const popup = new window.PaystackPop()

      /*
       * Start monitoring the transaction BEFORE opening
       * the popup.
       */
      pollPaymentStatus(data.reference)

      /*
       * Resume the transaction that was initialized
       * on your backend.
       */
      console.log(
        '[Paystack] Opening payment popup...'
      )

      popup.resumeTransaction(
        data.accessCode
      )
    } catch (err: any) {
      console.error(
        '[Paystack] Payment initialization error:',
        err
      )

      setError(
        err?.message ||
          'Could not open the payment window. Please refresh and try again.'
      )

      setSubscribing(false)
    }
  }

  /**
   * Find registration number.
   */
  const findRegNumber = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    setError('')

    try {
      const res = await fetch(
        '/api/exam-prep/forgot-reg',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: forgotName,
          }),
        }
      )

      const data = await res.json()

      setMatches(data.matches || [])
    } catch (err) {
      console.error(
        'Find registration number error:',
        err
      )

      setError(
        'Failed to find registration number'
      )
    }
  }

  return (
    <>
      {/* 
        Paystack InlineJS V2

        IMPORTANT:
        Do NOT use /v1/inline.js anymore.
      */}
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log(
            '[Paystack] InlineJS V2 loaded'
          )

          setPaystackLoaded(true)
        }}
        onError={(error) => {
          console.error(
            '[Paystack] Failed to load InlineJS:',
            error
          )

          setPaystackLoaded(false)
          setError(
            'Unable to load the payment system. Please refresh the page.'
          )
        }}
      />

      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">

          {showPlans ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">

              <h1 className="text-lg font-bold text-gray-900 mb-1">
                Choose a Plan
              </h1>

              <p className="text-sm text-gray-500 mb-4">
                Practice exams require a subscription.
              </p>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Your email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-3"
                required
              />

              {!paystackLoaded && (
                <div className="mb-3 rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-xs text-yellow-700">
                  Payment system is loading...
                </div>
              )}

              <div className="space-y-2">

                {plans.map((p) => (
                  <form
                    key={p.duration}
                    onSubmit={(e) =>
                      subscribe(
                        e,
                        p.duration
                      )
                    }
                    className="block"
                  >
                    <button
                      type="submit"
                      disabled={
                        subscribing ||
                        !paystackLoaded
                      }
                      className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
                    >

                      <span className="text-sm font-semibold capitalize">

                        {p.duration
                          .replace(
                            'months',
                            ' Months'
                          )
                          .replace(
                            'month',
                            ' Month'
                          )}

                        {subscribing && (
                          <Loader2
                            size={14}
                            className="inline ml-2 animate-spin"
                          />
                        )}

                      </span>

                      <span className="text-sm font-bold text-blue-600">
                        ₦
                        {Number(
                          p.price
                        ).toLocaleString(
                          'en-NG'
                        )}
                      </span>

                    </button>
                  </form>
                ))}

              </div>

              {error && (
                <p className="text-xs text-red-600 mt-3">
                  {error}
                </p>
              )}

              <button
                onClick={() => {
                  setShowPlans(false)
                  setError('')
                }}
                className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600"
              >
                ← Back to login
              </button>

            </div>
          ) : (

            <div className="bg-white rounded-2xl border border-gray-100 p-6">

              <h1 className="text-lg font-bold text-gray-900 mb-1">
                Practice Exam Login
              </h1>

              <p className="text-sm text-gray-500 mb-5">
                Enter your registration number to
                continue.
              </p>

              <form
                onSubmit={login}
                className="space-y-3"
              >

                <input
                  value={regNumber}
                  onChange={(e) =>
                    setRegNumber(
                      e.target.value
                    )
                  }
                  placeholder="LEH/EXAM/2026/123456"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-mono"
                  required
                />

                {error && (
                  <p className="text-xs text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition"
                >

                  {loading && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  Continue

                </button>

              </form>

              <button
                onClick={() =>
                  setShowForgot(
                    !showForgot
                  )
                }
                className="w-full text-center text-xs text-blue-600 mt-4 hover:underline"
              >
                Forgot your registration number?
              </button>

              {showForgot && (
                <form
                  onSubmit={findRegNumber}
                  className="mt-3 space-y-2"
                >

                  <input
                    value={forgotName}
                    onChange={(e) =>
                      setForgotName(
                        e.target.value
                      )
                    }
                    placeholder="Enter your full name as used during registration"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
                  >
                    Find My Registration
                    Number
                  </button>

                  {matches.map(
                    (m, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-lg p-2.5 text-xs flex items-center justify-between"
                      >

                        <span>
                          {m.fullName} ·{' '}
                          {m.school}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setRegNumber(
                              m.regNumber
                            )
                          }
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Use this
                        </button>

                      </div>
                    )
                  )}

                </form>
              )}

              <p className="text-center text-xs text-gray-400 mt-4">

                Not registered yet?{' '}

                <a
                  href="/exam-prep/register"
                  className="text-blue-600 underline"
                >
                  Register here
                </a>

              </p>

            </div>

          )}

        </div>
      </div>

      <Footer />
    </>
  )
}