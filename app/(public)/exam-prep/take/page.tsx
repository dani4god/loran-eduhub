'use client'

import {
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import Link from 'next/link'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

import {
  Loader2,
} from 'lucide-react'

interface Plan {
  duration: string
  price: number
  enabled?: boolean
}

const PLAN_LABELS:
  Record<string, string> = {
  trial:
    '1 Week Free Trial',

  monthly:
    '1 Month',

  '1month':
    '1 Month',

  '2months':
    '2 Months',

  '3months':
    '3 Months',

  '6months':
    '6 Months',

  '1year':
    '1 Year',

  life:
    'Lifetime',
}

export default function ExamPrepLoginPage() {
  const router = useRouter()

  const [
    regNumber,
    setRegNumber,
  ] = useState('')

  const [
    forgotName,
    setForgotName,
  ] = useState('')

  const [
    matches,
    setMatches,
  ] = useState<any[]>([])

  const [
    showForgot,
    setShowForgot,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    plans,
    setPlans,
  ] = useState<Plan[]>([])

  const [
    showPlans,
    setShowPlans,
  ] = useState(false)

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    subscribing,
    setSubscribing,
  ] = useState(false)

  const [
    selectedDuration,
    setSelectedDuration,
  ] = useState<string | null>(
    null
  )

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    const cleanReg =
      regNumber.trim()

    if (!cleanReg) {
      setError(
        'Enter your registration number'
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      const response =
        await fetch(
          '/api/exam-prep/login',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              regNumber:
                cleanReg,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Unable to continue'
        )
        return
      }

      /**
       * CRITICAL:
       *
       * Do NOT store registration number or
       * enter the dashboard here if payment
       * is still required.
       */
      if (
        data.requiresPayment
      ) {
        const plansResponse =
          await fetch(
            '/api/exam-prep/plans',
            {
              cache:
                'no-store',
            }
          )

        const plansData =
          await plansResponse.json()

        if (
          !plansResponse.ok
        ) {
          setError(
            plansData.error ||
              'Unable to load subscription plans'
          )
          return
        }

        setPlans(
          plansData.plans || []
        )

        setShowPlans(true)

        return
      }

      /**
       * Student genuinely has access.
       */
      localStorage.setItem(
        'examPrepRegNumber',
        data.student.regNumber
      )

      router.push(
        '/exam-prep/dashboard/take'
      )
    } catch (error) {
      console.error(
        'Exam Prep login error:',
        error
      )

      setError(
        'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // SUBSCRIBE
  // =========================================================

  const subscribe = async (
    e: React.FormEvent,
    duration: string
  ) => {
    e.preventDefault()

    if (!email.trim()) {
      setError(
        'Enter your email to receive your receipt'
      )
      return
    }

    if (!regNumber.trim()) {
      setError(
        'Registration number is missing. Please start again.'
      )
      return
    }

    setError('')
    setSubscribing(true)
    setSelectedDuration(
      duration
    )

    try {
      const response =
        await fetch(
          '/api/exam-prep/subscribe',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              regNumber:
                regNumber.trim(),

              duration,

              email:
                email.trim(),
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Unable to initialize payment'
        )
        return
      }

      /**
       * Free trial / zero-priced plan OR
       * student already has access.
       */
      if (
        data.requiresPayment ===
        false
      ) {
        localStorage.setItem(
          'examPrepRegNumber',
          data.regNumber ||
            regNumber.trim()
        )

        router.push(
          '/exam-prep/dashboard/take'
        )

        return
      }

      /**
       * PAID PLAN:
       *
       * Paystack must give us its hosted
       * checkout URL.
       */
      if (
        !data.authorizationUrl
      ) {
        console.error(
          'Missing Paystack authorizationUrl:',
          data
        )

        setError(
          'Paystack did not return a checkout link. Please try again.'
        )

        return
      }

      /**
       * IMPORTANT:
       *
       * No localStorage login.
       * No dashboard redirect.
       *
       * The student is sent to Paystack first.
       */
      window.location.assign(
        data.authorizationUrl
      )
    } catch (error) {
      console.error(
        'Exam Prep payment error:',
        error
      )

      setError(
        'Could not initialize payment. Please try again.'
      )
    } finally {
      /**
       * If the browser redirects to Paystack,
       * this doesn't matter.
       */
      setSubscribing(false)
    }
  }

  // =========================================================
  // FIND REGISTRATION NUMBER
  // =========================================================

  const findRegNumber =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault()

      if (!forgotName.trim()) {
        return
      }

      setError('')
      setMatches([])

      try {
        const response =
          await fetch(
            '/api/exam-prep/forgot-reg',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  fullName:
                    forgotName.trim(),
                }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          setError(
            data.error ||
              'Failed to find registration number'
          )
          return
        }

        setMatches(
          data.matches || []
        )

        if (
          !data.matches?.length
        ) {
          setError(
            'No registration number found for that name.'
          )
        }
      } catch {
        setError(
          'Failed to find registration number'
        )
      }
    }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-24 pb-16">

        <div className="max-w-md mx-auto px-4 sm:px-6">

          {showPlans ? (

            <div className="bg-white rounded-2xl border border-gray-100 p-6">

              <h1 className="text-lg font-bold text-gray-900 mb-1">
                Choose a Plan
              </h1>

              <p className="text-sm text-gray-500 mb-5">
                Select your Exam Prep subscription.
                Paid plans will take you to Paystack's
                secure checkout.
              </p>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Receipt Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-4"
              />

              {error && (
                <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3">

                  <p className="text-xs text-red-600">
                    {error}
                  </p>

                </div>
              )}

              <div className="space-y-2">

                {plans.map(
                  (plan) => {
                    const isThisPlanLoading =
                      subscribing &&
                      selectedDuration ===
                        plan.duration

                    return (
                      <form
                        key={
                          plan.duration
                        }
                        onSubmit={(
                          e
                        ) =>
                          subscribe(
                            e,
                            plan.duration
                          )
                        }
                      >

                        <button
                          type="submit"
                          disabled={
                            subscribing
                          }
                          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
                        >

                          <span className="text-sm font-semibold text-gray-900">

                            {PLAN_LABELS[
                              plan
                                .duration
                            ] ||
                              plan.duration}

                          </span>

                          <span className="flex items-center gap-2">

                            {isThisPlanLoading && (
                              <Loader2
                                size={
                                  15
                                }
                                className="animate-spin text-blue-600"
                              />
                            )}

                            <span className="text-sm font-bold text-blue-600">

                              {Number(
                                plan.price
                              ) === 0
                                ? 'FREE'
                                : `₦${Number(
                                    plan.price
                                  ).toLocaleString(
                                    'en-NG'
                                  )}`}

                            </span>

                          </span>

                        </button>

                      </form>
                    )
                  }
                )}

              </div>

              <p className="text-[11px] text-gray-400 mt-4 text-center">
                Payments are securely processed by Paystack.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowPlans(
                    false
                  )

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
                Enter your registration number to continue.
              </p>

              <form
                onSubmit={
                  login
                }
                className="space-y-3"
              >

                <input
                  value={
                    regNumber
                  }
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
                  disabled={
                    loading
                  }
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition"
                >

                  {loading && (
                    <Loader2
                      size={
                        15
                      }
                      className="animate-spin"
                    />
                  )}

                  Continue

                </button>

              </form>

              <button
                type="button"
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
                  onSubmit={
                    findRegNumber
                  }
                  className="mt-3 space-y-2"
                >

                  <input
                    value={
                      forgotName
                    }
                    onChange={(
                      e
                    ) =>
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
                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
                  >
                    Find My Registration Number
                  </button>

                  {matches.map(
                    (
                      match,
                      index
                    ) => (

                      <div
                        key={
                          match.regNumber ||
                          index
                        }
                        className="bg-gray-50 rounded-lg p-2.5 text-xs flex items-center justify-between gap-3"
                      >

                        <span>
                          {
                            match.fullName
                          }{' '}
                          ·{' '}
                          {
                            match.school
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setRegNumber(
                              match.regNumber
                            )

                            setShowForgot(
                              false
                            )
                          }}
                          className="text-blue-600 font-semibold hover:underline shrink-0"
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

                <Link
                  href="/exam-prep/register"
                  className="text-blue-600 underline"
                >
                  Register here
                </Link>

              </p>

            </div>

          )}

        </div>

      </div>

      <Footer />
    </>
  )
}