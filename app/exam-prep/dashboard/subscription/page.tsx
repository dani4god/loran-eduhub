// app/exam-prep/dashboard/subscription/page.tsx

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
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type Plan = {
  duration:
    | '1month'
    | '2months'
    | '3months'
    | 'life'

  label:
    string

  price:
    number
}

type SubscriptionData = {
  isPaid:
    boolean

  active:
    boolean

  expired:
    boolean

  requiresPayment:
    boolean

  subscription: {
    wasFreeAtRegistration:
      boolean

    planDuration:
      Plan['duration'] |
      null

    planLabel:
      string |
      null

    amountPaid:
      number

    startDate:
      string |
      null

    endDate:
      string |
      null

    isLifetime:
      boolean

    daysRemaining:
      number |
      null
  }

  plans:
    Plan[]
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(
  value:
    string |
    null
) {
  if (
    !value
  ) {
    return '—'
  }

  return new Date(
    value
  ).toLocaleDateString(
    'en-NG',
    {
      day:
        'numeric',

      month:
        'short',

      year:
        'numeric',
    }
  )
}

function formatMoney(
  value:
    number
) {
  return `₦${Number(
    value ||
      0
  ).toLocaleString(
    'en-NG'
  )}`
}

function SubscriptionLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

        <p className="mt-3 text-sm text-slate-500">
          Loading subscription...
        </p>
      </div>
    </div>
  )
}

// ============================================================
// CONTENT
// ============================================================

function SubscriptionContent() {
  const router =
    useRouter()

  const searchParams =
    useSearchParams()

  const [
    data,
    setData,
  ] =
    useState<
      SubscriptionData | null
    >(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    paying,
    setPaying,
  ] =
    useState<
      string | null
    >(
      null
    )

  const [
    verifying,
    setVerifying,
  ] =
    useState(
      false
    )

  const [
    verifiedReference,
    setVerifiedReference,
  ] =
    useState<
      string | null
    >(
      null
    )

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    message,
    setMessage,
  ] =
    useState('')

  // ==========================================================
  // LOAD SUBSCRIPTION
  // ==========================================================

  const loadSubscription =
    useCallback(
      async () => {
        setLoading(
          true
        )

        try {
          const response =
            await fetch(
              '/api/exam-prep/subscription',
              {
                cache:
                  'no-store',

                credentials:
                  'include',
              }
            )

          const result =
            await response.json()

          if (
            response.status ===
            401
          ) {
            router.replace(
              '/exam-prep/login'
            )

            return
          }

          if (
            !response.ok
          ) {
            throw new Error(
              result?.error ||
                'Could not load subscription.'
            )
          }

          setData(
            result
          )
        } catch (
          err:
            unknown
        ) {
          setError(
            err instanceof
            Error
              ? err.message
              : 'Could not load subscription.'
          )
        } finally {
          setLoading(
            false
          )
        }
      },
      [
        router,
      ]
    )

  useEffect(
    () => {
      loadSubscription()
    },
    [
      loadSubscription,
    ]
  )

  // ==========================================================
  // VERIFY PAYSTACK CALLBACK
  // ==========================================================

  useEffect(
    () => {
      const reference =
        searchParams.get(
          'reference'
        ) ||
        searchParams.get(
          'trxref'
        )

      if (
        !reference ||
        verifiedReference ===
          reference ||
        verifying
      ) {
        return
      }

      let cancelled =
        false

      const verify =
        async () => {
          setVerifying(
            true
          )

          setError('')
          setMessage(
            'Confirming your payment...'
          )

          try {
            const response =
              await fetch(
                '/api/exam-prep/subscribe/verify',
                {
                  method:
                    'POST',

                  credentials:
                    'include',

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

            const result =
              await response.json()

            if (
              !response.ok
            ) {
              throw new Error(
                result?.error ||
                  'Could not confirm payment.'
              )
            }

            if (
              cancelled
            ) {
              return
            }

            setVerifiedReference(
              reference
            )

            setMessage(
              result
                ?.alreadyProcessed
                ? 'This payment was already confirmed. Your subscription is active.'
                : 'Payment confirmed. Your Exam Prep subscription is now active.'
            )

            await loadSubscription()

            /*
             * Remove Paystack query parameters so refreshing
             * the page does not repeatedly call verification.
             */
            router.replace(
              '/exam-prep/dashboard/subscription'
            )
          } catch (
            err:
              unknown
          ) {
            if (
              cancelled
            ) {
              return
            }

            setMessage('')

            setError(
              err instanceof
              Error
                ? err.message
                : 'Could not confirm payment.'
            )
          } finally {
            if (
              !cancelled
            ) {
              setVerifying(
                false
              )
            }
          }
        }

      verify()

      return () => {
        cancelled =
          true
      }
    },
    [
      searchParams,
      verifiedReference,
      verifying,
      loadSubscription,
      router,
    ]
  )

  // ==========================================================
  // PURCHASE / RENEW
  // ==========================================================

  const choosePlan =
    async (
      plan:
        Plan
    ) => {
      setError('')
      setMessage('')
      setPaying(
        plan.duration
      )

      try {
        const response =
          await fetch(
            '/api/exam-prep/subscribe',
            {
              method:
                'POST',

              credentials:
                'include',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  planDuration:
                    plan.duration,
                }),
            }
          )

        const result =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            result?.error ||
              'Could not initialize payment.'
          )
        }

        if (
          !result
            ?.authorizationUrl
        ) {
          throw new Error(
            'Paystack did not return a payment page.'
          )
        }

        window.location.href =
          result.authorizationUrl
      } catch (
        err:
          unknown
      ) {
        setError(
          err instanceof
          Error
            ? err.message
            : 'Could not initialize payment.'
        )

        setPaying(
          null
        )
      }
    }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    !data
  ) {
    return (
      <SubscriptionLoading />
    )
  }

  const subscription =
    data?.subscription

  const active =
    Boolean(
      data?.active
    )

  const lifetime =
    Boolean(
      subscription
        ?.isLifetime
    )

  const hasPaidPlan =
    Boolean(
      subscription
        ?.planDuration
    )

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-7">
      {/* HEADER */}

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <CreditCard
              size={
                21
              }
            />
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
              Exam Prep Subscription
            </h1>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Manage your access, subscription plan and renewals.
            </p>
          </div>
        </div>
      </div>

      {/* MESSAGES */}

      {verifying && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <Loader2
            size={
              18
            }
            className="animate-spin"
          />

          Confirming your Paystack payment...
        </div>
      )}

      {message &&
        !verifying && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2
              size={
                18
              }
              className="mt-0.5 shrink-0"
            />

            {message}
          </div>
        )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={
              18
            }
            className="mt-0.5 shrink-0"
          />

          <span className="flex-1">
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            ×
          </button>
        </div>
      )}

      {/* FREE SYSTEM */}

      {data &&
        !data.isPaid && (
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-7">
            <ShieldCheck
              className="text-emerald-600"
              size={
                28
              }
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              Exam Prep is currently free
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              No subscription payment is currently required. Your Exam Prep account has access while the service remains free.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/exam-prep/dashboard'
                )
              }
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      {/* CURRENT SUBSCRIPTION */}

      {data?.isPaid && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className={`p-5 sm:p-6 ${
            active
              ? 'bg-gradient-to-r from-slate-950 to-blue-950 text-white'
              : 'bg-gradient-to-r from-slate-900 to-red-950 text-white'
          }`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
                  Current access
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {subscription
                    ?.wasFreeAtRegistration
                    ? 'Free Registration Access'
                    : subscription
                        ?.planLabel ||
                      (
                        hasPaidPlan
                          ? 'Exam Prep Plan'
                          : 'No Active Plan'
                      )}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                    active
                      ? 'bg-emerald-400/20 text-emerald-200'
                      : 'bg-red-400/20 text-red-200'
                  }`}>
                    {active
                      ? 'ACTIVE'
                      : 'SUBSCRIPTION REQUIRED'}
                  </span>

                  {lifetime && (
                    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-200">
                      LIFETIME
                    </span>
                  )}
                </div>
              </div>

              {lifetime ? (
                <Crown
                  size={
                    42
                  }
                  className="text-amber-300"
                />
              ) : active ? (
                <CheckCircle2
                  size={
                    42
                  }
                  className="text-emerald-300"
                />
              ) : (
                <AlertCircle
                  size={
                    42
                  }
                  className="text-red-300"
                />
              )}
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <CalendarDays
                size={
                  17
                }
                className="text-blue-600"
              />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Started
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {formatDate(
                  subscription
                    ?.startDate ||
                    null
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              {lifetime ? (
                <InfinityIcon
                  size={
                    17
                  }
                  className="text-purple-600"
                />
              ) : (
                <CalendarDays
                  size={
                    17
                  }
                  className="text-purple-600"
                />
              )}

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Expires
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {lifetime
                  ? 'Never'
                  : formatDate(
                      subscription
                        ?.endDate ||
                        null
                    )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock3
                size={
                  17
                }
                className="text-amber-600"
              />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Remaining
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {lifetime
                  ? 'Lifetime'
                  : subscription
                        ?.daysRemaining !==
                      null &&
                    subscription
                        ?.daysRemaining !==
                      undefined
                    ? `${subscription.daysRemaining} day${
                        subscription.daysRemaining ===
                        1
                          ? ''
                          : 's'
                      }`
                    : '—'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <CreditCard
                size={
                  17
                }
                className="text-emerald-600"
              />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Last payment
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {subscription
                  ?.amountPaid
                  ? formatMoney(
                      subscription.amountPaid
                    )
                  : '—'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* PLANS */}

      {data?.isPaid &&
        !lifetime && (
          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {active
                    ? 'Renew or extend your subscription'
                    : 'Choose a subscription plan'}
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {active
                    ? 'Renewing early will not remove your remaining days. New time is added after your current expiry date.'
                    : 'Select a plan below to activate Exam Prep access.'}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  loadSubscription
                }
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
              >
                <RefreshCw
                  size={
                    13
                  }
                  className={
                    loading
                      ? 'animate-spin'
                      : ''
                  }
                />

                Refresh
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {data.plans.map(
                (
                  plan,
                  index
                ) => {
                  const isLifetime =
                    plan.duration ===
                    'life'

                  const isProcessing =
                    paying ===
                    plan.duration

                  return (
                    <article
                      key={
                        plan.duration
                      }
                      className={`relative flex flex-col overflow-hidden rounded-3xl border bg-white p-5 shadow-sm ${
                        index ===
                        2
                          ? 'border-blue-300 ring-2 ring-blue-100'
                          : 'border-slate-200'
                      }`}
                    >
                      {index ===
                        2 && (
                        <div className="absolute right-0 top-0 rounded-bl-xl bg-blue-600 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-white">
                          Popular
                        </div>
                      )}

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        {isLifetime ? (
                          <Crown
                            size={
                              21
                            }
                          />
                        ) : (
                          <Sparkles
                            size={
                              21
                            }
                          />
                        )}
                      </div>

                      <h3 className="mt-5 text-lg font-black text-slate-900">
                        {plan.label}
                      </h3>

                      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                        {formatMoney(
                          plan.price
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {isLifetime
                          ? 'One-time payment'
                          : 'Exam Prep access'}
                      </p>

                      <div className="mt-5 flex-1 space-y-2 text-xs text-slate-600">
                        <p className="flex items-start gap-2">
                          <Check
                            size={
                              14
                            }
                            className="mt-0.5 shrink-0 text-emerald-500"
                          />

                          Practice examinations
                        </p>

                        <p className="flex items-start gap-2">
                          <Check
                            size={
                              14
                            }
                            className="mt-0.5 shrink-0 text-emerald-500"
                          />

                          Exam Arena competitions
                        </p>

                        <p className="flex items-start gap-2">
                          <Check
                            size={
                              14
                            }
                            className="mt-0.5 shrink-0 text-emerald-500"
                          />

                          AI analytics and tutoring
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          Boolean(
                            paying
                          ) ||
                          verifying
                        }
                        onClick={() =>
                          choosePlan(
                            plan
                          )
                        }
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isProcessing && (
                          <Loader2
                            size={
                              15
                            }
                            className="animate-spin"
                          />
                        )}

                        {isProcessing
                          ? 'Opening Paystack...'
                          : active
                            ? `Renew ${plan.label}`
                            : `Choose ${plan.label}`}
                      </button>
                    </article>
                  )
                }
              )}
            </div>
          </section>
        )}

      {/* ACTIVE NAVIGATION */}

      {data?.isPaid &&
        active && (
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={
                  20
                }
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-black text-emerald-900">
                  Your Exam Prep access is active
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  You can use practice exams, analytics, AI Tutor and Exam Arena.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/exam-prep/dashboard'
                )
              }
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"
            >
              Go to Dashboard
            </button>
          </div>
        )}
    </div>
  )
}

// ============================================================
// PAGE + SUSPENSE
// ============================================================

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <SubscriptionLoading />
      }
    >
      <SubscriptionContent />
    </Suspense>
  )
}