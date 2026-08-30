// app/dashboard/self-paced/course/[id]/book/page.tsx

'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  useParams,
  useRouter,
} from 'next/navigation'

import {
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react'

interface CoachingSlot {
  _id: string
  date: string
  startTime: string
  endTime: string
}

export default function BookCoachingPage() {
  const params =
    useParams()

  const router =
    useRouter()

  const courseId =
    params.id as string

  const [slots, setSlots] =
    useState<CoachingSlot[]>([])

  const [loading, setLoading] =
    useState(true)

  const [booking, setBooking] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState<
      'error' | 'success' | ''
    >('')

  const loadSlots =
    useCallback(async () => {
      try {
        setLoading(true)

        const res = await fetch(
          `/api/self-paced/availability?courseId=${encodeURIComponent(
            courseId
          )}`,
          {
            cache: 'no-store',
          }
        )

        const data =
          await res.json()

        if (!res.ok) {
          throw new Error(
            data?.error ||
              'Failed to load coaching slots'
          )
        }

        setSlots(
          Array.isArray(data?.slots)
            ? data.slots
            : []
        )
      } catch (err: any) {
        setMessageType('error')

        setMessage(
          err?.message ||
            'Failed to load coaching slots'
        )
      } finally {
        setLoading(false)
      }
    }, [courseId])

  useEffect(() => {
    if (courseId) {
      loadSlots()
    }
  }, [
    courseId,
    loadSlots,
  ])

  const book = async (
    slotId: string
  ) => {
    if (booking) {
      return
    }

    setBooking(slotId)
    setMessage('')
    setMessageType('')

    try {
      const res = await fetch(
        '/api/self-paced/booking/initiate',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            courseId,
            slotId,
          }),
        }
      )

      const data =
        await res.json()

      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Failed to reserve coaching slot'
        )
      }

      if (
        !data?.authorizationUrl
      ) {
        throw new Error(
          'Payment authorization link was not returned'
        )
      }

      /*
       * Backend has already initialized this transaction.
       * Do NOT call PaystackPop.setup() again.
       */
      window.location.href =
        data.authorizationUrl
    } catch (err: any) {
      setMessageType('error')

      setMessage(
        err?.message ||
          'Could not start coaching booking'
      )

      setBooking(null)

      /*
       * Reload because another student may have reserved
       * the selected slot.
       */
      await loadSlots()
    }
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">

      <div className="max-w-md mx-auto px-4 sm:px-6 py-6">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/dashboard/self-paced/course/${courseId}`
            )
          }
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mb-5"
        >
          <ArrowLeft
            size={14}
          />
          Back to course
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Book 1-on-1 Coaching
        </h1>

        <p className="text-sm text-gray-500 mb-2">
          Choose an available coaching session and pay securely to confirm it.
        </p>

        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg p-2.5 mb-5">
          Once you begin checkout, your selected slot is temporarily held for 15 minutes.
        </p>

        {message && (
          <div
            className={`flex items-start gap-2 text-sm rounded-xl p-3 mb-4 border ${
              messageType ===
              'success'
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-700 bg-red-50 border-red-100'
            }`}
          >

            <AlertCircle
              size={16}
              className="shrink-0 mt-0.5"
            />

            <span>
              {message}
            </span>

          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">

            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />

            <p className="text-sm text-gray-400 mt-3">
              Loading available slots...
            </p>

          </div>
        ) : (
          <div className="space-y-2">

            {slots.map(
              (slot) => (
                <div
                  key={slot._id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
                >

                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar
                      size={16}
                      className="text-blue-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(
                        slot.date
                      ).toLocaleDateString(
                        'en-NG',
                        {
                          weekday:
                            'short',
                          day:
                            'numeric',
                          month:
                            'short',
                          year:
                            'numeric',
                        }
                      )}
                    </p>

                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock
                        size={11}
                      />

                      {
                        slot.startTime
                      }
                      –
                      {
                        slot.endTime
                      }
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      book(
                        slot._id
                      )
                    }
                    disabled={Boolean(
                      booking
                    )}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >

                    {booking ===
                      slot._id && (
                      <Loader2
                        size={12}
                        className="animate-spin"
                      />
                    )}

                    {booking ===
                    slot._id
                      ? 'Redirecting...'
                      : 'Book'}

                  </button>

                </div>
              )
            )}

            {slots.length ===
              0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">

                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />

                <p className="text-gray-400 text-sm">
                  No coaching slots are available right now.
                </p>

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  )
}