// app/exam-prep/dashboard/subscribe/page.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import {
  useSearchParams,
  useRouter,
} from 'next/navigation'
import { Loader2 } from 'lucide-react'

function SubscribeContent() {
  const router = useRouter()
  const search = useSearchParams()

  const [plans, setPlans] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  useEffect(() => {
    fetch('/api/exam-prep/plans')
      .then((r) => r.json())
      .then((d) =>
        setPlans(
          d.plans || []
        )
      )
      .catch(() => {
        setMessage(
          'Unable to load subscription plans.'
        )
      })
  }, [])

  useEffect(() => {
    const reference =
      search.get('reference') ||
      search.get('trxref')

    if (!reference) {
      return
    }

    setLoading(true)

    fetch(
      '/api/exam-prep/subscribe/verify',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            reference,
          }),
      }
    )
      .then(
        async (r) => ({
          ok: r.ok,
          data:
            await r.json(),
        })
      )
      .then(
        ({
          ok,
          data,
        }) => {
          if (!ok) {
            throw new Error(
              data.error ||
                'Payment verification failed.'
            )
          }

          setMessage(
            'Payment confirmed. Your Exam Prep access is active.'
          )

          setTimeout(
            () => {
              router.replace(
                '/exam-prep/dashboard'
              )
            },
            1800
          )
        }
      )
      .catch(
        (error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Payment verification failed.'
          )
        }
      )
      .finally(() => {
        setLoading(false)
      })
  }, [search, router])

  const buy =
    async (
      planDuration: string
    ) => {
      setLoading(true)
      setMessage('')

      try {
        const res =
          await fetch(
            '/api/exam-prep/subscribe',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  planDuration,
                }),
            }
          )

        const data =
          await res.json()

        if (!res.ok) {
          throw new Error(
            data.error ||
              'Unable to start payment.'
          )
        }

        if (
          !data.authorizationUrl
        ) {
          throw new Error(
            'Payment authorization URL was not returned.'
          )
        }

        window.location.href =
          data.authorizationUrl
      } catch (
        error: unknown
      ) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to start payment.'
        )

        setLoading(false)
      }
    }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">
          Exam Prep Subscription
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Choose a plan to unlock
          practice, AI coaching and
          Exam Arena.
        </p>

        {message && (
          <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map(
            (
              plan: any
            ) => (
              <div
                key={
                  plan.duration
                }
                className="rounded-2xl border bg-white p-5"
              >
                <h2 className="font-bold">
                  {
                    plan.duration
                  }
                </h2>

                <p className="mt-2 text-2xl font-black">
                  ₦
                  {Number(
                    plan.price
                  ).toLocaleString()}
                </p>

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() =>
                    buy(
                      plan.duration
                    )
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2
                      size={
                        14
                      }
                      className="animate-spin"
                    />
                  )}

                  Choose
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function SubscribeLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2
          size={20}
          className="animate-spin"
        />

        <span className="text-sm font-medium">
          Loading subscription...
        </span>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <SubscribeLoading />
      }
    >
      <SubscribeContent />
    </Suspense>
  )
}