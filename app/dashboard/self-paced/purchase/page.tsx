// app/dashboard/self-paced/purchase/page.tsx

'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

import {
  Layers,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface AvailableCourse {
  _id: string
  title: string
  tutorName?: string
  weekCount?: number
  coverImageUrl?: string | null
  price: number
  isFree: boolean
}

function PurchaseContent() {
  const searchParams =
    useSearchParams()

  const router =
    useRouter()

  const [courses, setCourses] =
    useState<AvailableCourse[]>([])

  const [loading, setLoading] =
    useState(true)

  const [verifying, setVerifying] =
    useState(false)

  const [buyingId, setBuyingId] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState<
      'success' | 'error' | ''
    >('')

  const loadCourses =
    useCallback(async () => {
      try {
        const res = await fetch(
          '/api/self-paced/courses/available',
          {
            cache: 'no-store',
          }
        )

        const data =
          await res.json()

        if (!res.ok) {
          throw new Error(
            data?.error ||
              'Failed to load courses'
          )
        }

        setCourses(
          Array.isArray(data?.courses)
            ? data.courses
            : []
        )
      } catch (err: any) {
        setMessageType('error')

        setMessage(
          err?.message ||
            'Failed to load courses'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  // ----------------------------------------------------------
  // Initial load
  // ----------------------------------------------------------

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  // ----------------------------------------------------------
  // Paystack callback verification
  // ----------------------------------------------------------

  useEffect(() => {
    const reference =
      searchParams.get(
        'reference'
      ) ||
      searchParams.get(
        'trxref'
      )

    if (!reference) {
      return
    }

    let cancelled =
      false

    async function verify() {
      try {
        setVerifying(true)
        setMessage('')

        const res = await fetch(
          `/api/self-paced/purchase/quick/verify?reference=${encodeURIComponent(
            reference!
          )}`,
          {
            cache: 'no-store',
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
              'Payment verification failed'
          )
        }

        if (cancelled) {
          return
        }

        setMessageType(
          'success'
        )

        setMessage(
          'Course added to your dashboard!'
        )

        await loadCourses()

        /*
         * Remove Paystack reference from URL so refreshing
         * does not keep calling verification.
         */
        router.replace(
          '/dashboard/self-paced/purchase'
        )
      } catch (err: any) {
        if (!cancelled) {
          setMessageType(
            'error'
          )

          setMessage(
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
      cancelled =
        true
    }
  }, [
    searchParams,
    router,
    loadCourses,
  ])

  // ----------------------------------------------------------
  // Buy course
  // ----------------------------------------------------------

  const buy = async (
    course: AvailableCourse
  ) => {
    if (buyingId) {
      return
    }

    setBuyingId(course._id)
    setMessage('')
    setMessageType('')

    try {
      const res = await fetch(
        '/api/self-paced/purchase/quick',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            courseId:
              course._id,
          }),
        }
      )

      const data =
        await res.json()

      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Failed to start purchase'
        )
      }

      // Free course
      if (
        !data?.requiresPayment
      ) {
        setMessageType(
          'success'
        )

        setMessage(
          'Course added to your dashboard!'
        )

        await loadCourses()

        setBuyingId(null)

        return
      }

      // Paid course
      if (
        !data?.authorizationUrl
      ) {
        throw new Error(
          'Payment authorization link was not returned'
        )
      }

      window.location.href =
        data.authorizationUrl
    } catch (err: any) {
      setMessageType('error')

      setMessage(
        err?.message ||
          'Could not start purchase'
      )

      setBuyingId(null)
    }
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Purchase Another Course
        </h1>

        <p className="text-sm text-gray-500 mb-5">
          Your account is already set up — choose another course to add to your dashboard.
        </p>

        {verifying && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">

            <Loader2
              size={16}
              className="animate-spin shrink-0"
            />

            Confirming your payment. Please do not pay again.

          </div>
        )}

        {message && (
          <div
            className={`flex items-start gap-2 text-sm rounded-xl p-3 mb-4 border ${
              messageType ===
              'success'
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-700 bg-red-50 border-red-100'
            }`}
          >

            {messageType ===
            'success' ? (
              <CheckCircle2
                size={17}
                className="shrink-0 mt-0.5"
              />
            ) : (
              <AlertCircle
                size={17}
                className="shrink-0 mt-0.5"
              />
            )}

            <span>
              {message}
            </span>

          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">

            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />

          </div>
        ) : courses.length ===
          0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 px-5 text-center">

            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />

            <p className="text-gray-500 text-sm">
              You already own every available course, or there are no published courses available right now.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {courses.map(
              (course) => (
                <div
                  key={course._id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >

                  <div className="h-32 bg-gray-100">

                    {course.coverImageUrl ? (
                      <img
                        src={
                          course.coverImageUrl
                        }
                        alt={
                          course.title
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">

                        <Layers className="w-7 h-7 text-gray-300" />

                      </div>
                    )}

                  </div>

                  <div className="p-4">

                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      {course.title}
                    </h3>

                    <p className="text-xs text-gray-400 mb-3">
                      {course.tutorName ||
                        'Loran EduHub'}{' '}
                      ·{' '}
                      {course.weekCount ||
                        0}{' '}
                      week
                      {(course.weekCount ||
                        0) !== 1
                        ? 's'
                        : ''}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        buy(course)
                      }
                      disabled={
                        Boolean(
                          buyingId
                        ) ||
                        verifying
                      }
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >

                      {buyingId ===
                      course._id ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <DollarSign
                          size={14}
                        />
                      )}

                      {buyingId ===
                      course._id
                        ? course.isFree
                          ? 'Adding course...'
                          : 'Redirecting to Paystack...'
                        : course.isFree
                        ? 'Get Free Course'
                        : `Buy for ₦${Number(
                            course.price ||
                              0
                          ).toLocaleString(
                            'en-NG'
                          )}`}

                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  )
}

export default function PurchaseAnotherCoursePage() {
  return (
    <Suspense
      fallback={
        <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center">

          <div className="text-center">

            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />

            <p className="text-gray-500 mt-3 text-sm">
              Loading...
            </p>

          </div>

        </div>
      }
    >
      <PurchaseContent />
    </Suspense>
  )
}