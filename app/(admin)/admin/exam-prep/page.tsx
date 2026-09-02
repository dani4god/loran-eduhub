'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  Unlock,
} from 'lucide-react'

import AdminLayout from '@/components/admin/AdminLayout'

type PlanDuration =
  | '1month'
  | '2months'
  | '3months'
  | 'life'

type Plan = {
  duration: PlanDuration
  label: string
  price: number
  enabled: boolean
}

type Settings = {
  isLocked: boolean
  isPaid: boolean
  plans: Plan[]
  updatedAt?: string
}

const FALLBACK_PLANS: Plan[] = [
  {
    duration: '1month',
    label: '1 Month',
    price: 1000,
    enabled: true,
  },
  {
    duration: '2months',
    label: '2 Months',
    price: 1800,
    enabled: true,
  },
  {
    duration: '3months',
    label: '3 Months',
    price: 2500,
    enabled: true,
  },
  {
    duration: 'life',
    label: 'Lifetime',
    price: 5000,
    enabled: true,
  },
]

function formatNaira(value: number) {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }
  ).format(value || 0)
}

export default function ExamPrepSettingsPage() {
  const router = useRouter()

  const {
    data: session,
    status: sessionStatus,
  } = useSession()

  const [settings, setSettings] =
    useState<Settings>({
      isLocked: false,
      isPaid: false,
      plans: FALLBACK_PLANS,
    })

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  useEffect(() => {
    if (
      sessionStatus ===
      'unauthenticated'
    ) {
      router.replace(
        '/auth/admin/login'
      )

      return
    }

    if (
      sessionStatus ===
        'authenticated' &&
      session?.user?.role !== 'admin'
    ) {
      router.replace(
        '/unauthorized'
      )
    }
  }, [
    router,
    session,
    sessionStatus,
  ])

  const loadSettings =
    useCallback(async () => {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(
          '/api/admin/exam-prep/settings',
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data =
          await res.json()

        if (!res.ok) {
          throw new Error(
            data.error ||
              'Failed to load settings'
          )
        }

        setSettings({
          isLocked: Boolean(
            data.settings?.isLocked
          ),

          isPaid: Boolean(
            data.settings?.isPaid
          ),

          plans:
            Array.isArray(
              data.settings?.plans
            ) &&
            data.settings.plans.length
              ? data.settings.plans
              : FALLBACK_PLANS,

          updatedAt:
            data.settings
              ?.updatedAt,
        })
      } catch (err: any) {
        setError(
          err?.message ||
            'Failed to load Exam Prep settings'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    if (
      sessionStatus ===
        'authenticated' &&
      session?.user?.role === 'admin'
    ) {
      loadSettings()
    }
  }, [
    loadSettings,
    session,
    sessionStatus,
  ])

  const enabledPlanCount =
    useMemo(
      () =>
        settings.plans.filter(
          (plan) => plan.enabled
        ).length,
      [settings.plans]
    )

  function updatePlan(
    duration: PlanDuration,
    patch: Partial<Plan>
  ) {
    setSettings((current) => ({
      ...current,

      plans: current.plans.map(
        (plan) =>
          plan.duration ===
          duration
            ? {
                ...plan,
                ...patch,
              }
            : plan
      ),
    }))
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      if (
        settings.isPaid &&
        enabledPlanCount === 0
      ) {
        throw new Error(
          'Enable at least one subscription plan first.'
        )
      }

      const res = await fetch(
        '/api/admin/exam-prep/settings',
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            isLocked:
              settings.isLocked,

            isPaid:
              settings.isPaid,

            plans:
              settings.plans,
          }),
        }
      )

      const data =
        await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to save settings'
        )
      }

      setSettings((current) => ({
        ...current,
        ...data.settings,
      }))

      setMessage(
        'Exam Prep settings saved successfully.'
      )
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to save Exam Prep settings'
      )
    } finally {
      setSaving(false)
    }
  }

  if (
    sessionStatus === 'loading' ||
    loading
  ) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm text-gray-500">
              Loading Exam Prep
              settings...
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (
    session?.user?.role !== 'admin'
  ) {
    return null
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-600" />

              <h1 className="text-2xl font-bold text-gray-900">
                Exam Prep Settings
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Control Exam Prep
              availability,
              subscriptions and
              pricing.
            </p>

            {settings.updatedAt && (
              <p className="mt-1 text-xs text-gray-400">
                Last updated:{' '}
                {new Date(
                  settings.updatedAt
                ).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? 'Saving...'
                : 'Save Settings'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm font-medium">
              {message}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* EXAM LOCK */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Exam Prep Availability
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Lock the entire
                  Exam Prep system
                  when you do not
                  want students
                  starting practice
                  exams or Arena
                  competitions.
                </p>
              </div>

              <div
                className={`rounded-xl p-3 ${
                  settings.isLocked
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
                }`}
              >
                {settings.isLocked ? (
                  <Lock className="h-6 w-6" />
                ) : (
                  <Unlock className="h-6 w-6" />
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSettings(
                  (current) => ({
                    ...current,
                    isLocked:
                      !current.isLocked,
                  })
                )
              }
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                settings.isLocked
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {settings.isLocked
                    ? 'Exam Prep is locked'
                    : 'Exam Prep is open'}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {settings.isLocked
                    ? 'Students should be blocked from starting exams and Arena rounds.'
                    : 'Students may use Exam Prep subject to subscription rules.'}
                </p>
              </div>

              <span
                className={`relative h-7 w-12 rounded-full transition ${
                  settings.isLocked
                    ? 'bg-red-500'
                    : 'bg-green-500'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    settings.isLocked
                      ? 'left-6'
                      : 'left-1'
                  }`}
                />
              </span>
            </button>
          </section>

          {/* PAYMENT */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Subscription
                  Requirement
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Decide whether
                  registered Exam
                  Prep students can
                  use the system
                  free or need an
                  active
                  subscription.
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setSettings(
                    (current) => ({
                      ...current,
                      isPaid: false,
                    })
                  )
                }
                className={`rounded-xl border p-4 text-left transition ${
                  !settings.isPaid
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-900">
                  Free Access
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  No subscription
                  required.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSettings(
                    (current) => ({
                      ...current,
                      isPaid: true,
                    })
                  )
                }
                className={`rounded-xl border p-4 text-left transition ${
                  settings.isPaid
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-900">
                  Paid Access
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Active
                  subscription
                  required.
                </p>
              </button>
            </div>
          </section>
        </div>

        {/* PLANS */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Subscription Plans
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Prices are stored
                  in Naira and used
                  by the student
                  subscription
                  checkout flow.
                </p>
              </div>

              <span className="text-sm font-medium text-gray-500">
                {enabledPlanCount}{' '}
                of{' '}
                {settings.plans.length}{' '}
                plans enabled
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
            {settings.plans.map(
              (plan) => (
                <div
                  key={
                    plan.duration
                  }
                  className={`rounded-2xl border p-4 transition ${
                    plan.enabled
                      ? 'border-blue-200 bg-blue-50/40'
                      : 'border-gray-200 bg-gray-50 opacity-75'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">
                        {plan.label}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatNaira(
                          plan.price
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updatePlan(
                          plan.duration,
                          {
                            enabled:
                              !plan.enabled,
                          }
                        )
                      }
                      className={`relative h-6 w-11 rounded-full transition ${
                        plan.enabled
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                      aria-label={`${
                        plan.enabled
                          ? 'Disable'
                          : 'Enable'
                      } ${
                        plan.label
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          plan.enabled
                            ? 'left-5'
                            : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Price (₦)
                  </label>

                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={
                      plan.price
                    }
                    onChange={(
                      event
                    ) =>
                      updatePlan(
                        plan.duration,
                        {
                          price:
                            Math.max(
                              0,
                              Number(
                                event
                                  .target
                                  .value
                              ) ||
                                0
                            ),
                        }
                      )
                    }
                    disabled={
                      !plan.enabled
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              )
            )}
          </div>
        </section>

        {/* EXPLANATION */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
          <p className="font-semibold">
            How the controls behave
          </p>

          <div className="mt-2 space-y-1.5 text-blue-800">
            <p>
              <strong>
                Open + Free:
              </strong>{' '}
              every authenticated
              Exam Prep student can
              practice and
              join/create Arena
              rooms.
            </p>

            <p>
              <strong>
                Open + Paid:
              </strong>{' '}
              only students with
              valid Exam Prep
              access can start
              protected activities.
            </p>

            <p>
              <strong>
                Locked:
              </strong>{' '}
              student exam activity
              should be blocked
              regardless of
              subscription status.
              Admin management
              remains available.
            </p>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}