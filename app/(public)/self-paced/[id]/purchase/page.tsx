'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'

interface PublicCourse {
  _id: string
  title: string
  description?: string
  coverImageUrl?: string | null
  price: number
  isFree: boolean
}

export default function PurchaseCoursePage() {
  const params = useParams()
  const router = useRouter()

  const courseId = params.id as string

  const [course, setCourse] = useState<PublicCourse | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [loadingCourse, setLoadingCourse] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [error, setError] = useState('')

  // ----------------------------------------------------------
  // Load course
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      try {
        setLoadingCourse(true)
        setError('')

        const res = await fetch(
          `/api/self-paced/courses/${courseId}/public`,
          {
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(
            data?.error || 'Failed to load course'
          )
        }

        if (!cancelled) {
          setCourse(data)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message || 'Failed to load course'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingCourse(false)
        }
      }
    }

    if (courseId) {
      loadCourse()
    }

    return () => {
      cancelled = true
    }
  }, [courseId])

  // ----------------------------------------------------------
  // Verify after Paystack redirects back
  // ----------------------------------------------------------

  useEffect(() => {
    if (!courseId) return

    const query = new URLSearchParams(
      window.location.search
    )

    const reference =
      query.get('reference') ||
      query.get('trxref')

    if (!reference) return

    let cancelled = false

    async function verify() {
      try {
        setVerifying(true)
        setError('')

        const res = await fetch(
          `/api/self-paced/purchase/verify?reference=${encodeURIComponent(
            reference!
          )}`,
          {
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (!res.ok || !data?.success) {
          throw new Error(
            data?.error ||
              'Payment verification failed'
          )
        }

        if (!cancelled) {
          router.replace(
            '/self-paced/purchase-success'
          )
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            `${
              err?.message ||
              'Could not confirm payment'
            }. If you were charged, do not pay again. Reference: ${reference}`
          )
        }
      } finally {
        if (!cancelled) {
          setVerifying(false)
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [courseId, router])

  // ----------------------------------------------------------
  // Purchase
  // ----------------------------------------------------------

  const submit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()
    const cleanEmail = email
      .trim()
      .toLowerCase()
    const cleanPhone = phone.trim()

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanEmail ||
      !cleanPhone ||
      !password
    ) {
      setError('All fields are required')
      return
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters'
      )
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(
        '/api/self-paced/purchase/initiate',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: cleanEmail,
            phone: cleanPhone,
            password,
            courseId,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Failed to start purchase'
        )
      }

      // Free course
      if (data?.isFree) {
        router.push(
          '/self-paced/purchase-success'
        )
        return
      }

      // Paid course
      if (!data?.authorizationUrl) {
        throw new Error(
          'Payment authorization link was not returned'
        )
      }

      window.location.href =
        data.authorizationUrl
    } catch (err: any) {
      setError(
        err?.message ||
          'Something went wrong'
      )

      setSubmitting(false)
    }
  }

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------

  if (loadingCourse) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />

            <p className="text-sm text-gray-500">
              Loading course...
            </p>
          </div>
        </div>

        <Footer />
      </>
    )
  }

  // ----------------------------------------------------------
  // Verification screen
  // ----------------------------------------------------------

  if (verifying) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center px-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center max-w-md w-full">

            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />

            <h1 className="text-lg font-bold text-gray-900 mb-2">
              Confirming your payment
            </h1>

            <p className="text-sm text-gray-500">
              Please do not refresh this page or make another payment.
            </p>

          </div>
        </div>

        <Footer />
      </>
    )
  }

  if (!course) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center px-4">

          <div className="text-center">
            <p className="text-red-600 text-sm">
              {error || 'Course not found'}
            </p>

            <button
              onClick={() =>
                router.push('/self-paced')
              }
              className="mt-4 text-blue-600 text-sm font-semibold"
            >
              Back to courses
            </button>
          </div>

        </div>

        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-24 pb-16">

        <div className="max-w-md mx-auto px-4 sm:px-6">

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

            {course.coverImageUrl && (
              <div className="h-44 bg-gray-100">

                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />

              </div>
            )}

            <div className="p-6">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/self-paced/${courseId}`
                  )
                }
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mb-4"
              >
                <ArrowLeft size={14} />
                Back to course
              </button>

              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {course.title}
              </h1>

              <p
                className={`text-base font-bold mb-5 ${
                  course.isFree
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`}
              >
                {course.isFree
                  ? 'Free'
                  : `₦${Number(
                      course.price
                    ).toLocaleString(
                      'en-NG'
                    )}`}
              </p>

              <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 mb-5">

                <ShieldCheck
                  size={17}
                  className="text-blue-600 shrink-0 mt-0.5"
                />

                <p className="text-xs text-blue-700 leading-relaxed">
                  Your account will be used to access this course after purchase.
                </p>

              </div>

              <form
                onSubmit={submit}
                className="space-y-3"
              >

                <div className="grid grid-cols-2 gap-2">

                  <input
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(
                        e.target.value
                      )
                    }
                    placeholder="First name"
                    autoComplete="given-name"
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
                    required
                  />

                  <input
                    value={lastName}
                    onChange={(e) =>
                      setLastName(
                        e.target.value
                      )
                    }
                    placeholder="Last name"
                    autoComplete="family-name"
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
                    required
                  />

                </div>

                <input
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
                  required
                />

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  type="tel"
                  placeholder="Phone"
                  autoComplete="tel"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
                  required
                />

                <input
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  type="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
                  required
                />

                <p className="text-[11px] text-gray-400">
                  If this email already belongs to a self-paced student account, your existing password will remain unchanged.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs text-red-600">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >

                  {submitting && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {submitting
                    ? course.isFree
                      ? 'Setting up your course...'
                      : 'Redirecting to Paystack...'
                    : course.isFree
                    ? 'Get This Course Free'
                    : `Pay ₦${Number(
                        course.price
                      ).toLocaleString(
                        'en-NG'
                      )}`}

                </button>

                {!course.isFree && (
                  <p className="text-[11px] text-gray-400 text-center">
                    Secure payment powered by Paystack.
                  </p>
                )}

              </form>

            </div>

          </div>

        </div>

      </div>

      <Footer />
    </>
  )
}