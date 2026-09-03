// app/exam-prep/dashboard/register/page.tsx

'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import Link from 'next/link'

import {
  Check,
  CreditCard,
  Loader2,
} from 'lucide-react'

type RegistrationResult = {
  regNumber: string
  requiresPayment: boolean
  redirectTo: string
}

export default function RegisterPage() {
  const router =
    useRouter()

  const [
    catalog,
    setCatalog,
  ] =
    useState<any[]>(
      []
    )

  const [
    subjects,
    setSubjects,
  ] =
    useState<string[]>(
      []
    )

  const [
    form,
    setForm,
  ] =
    useState({
      fullName:
        '',
      email:
        '',
      location:
        '',
      school:
        '',
      pin:
        '',
      confirmPin:
        '',
    })

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    )

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    result,
    setResult,
  ] =
    useState<
      RegistrationResult | null
    >(
      null
    )

  // ==========================================================
  // SUBJECTS
  // ==========================================================

  useEffect(
    () => {
      fetch(
        '/api/exam-prep/subjects'
      )
        .then(
          async (
            response
          ) => {
            const data =
              await response.json()

            if (
              !response.ok
            ) {
              throw new Error(
                data?.error ||
                  'Could not load subjects.'
              )
            }

            return data
          }
        )
        .then(
          (
            data
          ) => {
            setCatalog(
              Array.isArray(
                data?.categories
              )
                ? data.categories
                : []
            )
          }
        )
        .catch(
          (
            err
          ) => {
            console.error(
              'Exam Prep subjects:',
              err
            )
          }
        )
    },
    []
  )

  const toggle =
    (
      subject:
        string
    ) => {
      setSubjects(
        (
          current
        ) =>
          current.includes(
            subject
          )
            ? current.filter(
                (
                  item
                ) =>
                  item !==
                  subject
              )
            : [
                ...current,
                subject,
              ]
      )
    }

  // ==========================================================
  // REGISTER
  // ==========================================================

  const submit =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault()

      setError('')

      if (
        form.pin !==
        form.confirmPin
      ) {
        setError(
          'PINs do not match.'
        )

        return
      }

      if (
        !/^\d{6}$/.test(
          form.pin
        )
      ) {
        setError(
          'PIN must contain exactly 6 digits.'
        )

        return
      }

      setLoading(
        true
      )

      try {
        const response =
          await fetch(
            '/api/exam-prep/register',
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
                    form.fullName,

                  email:
                    form.email,

                  location:
                    form.location,

                  school:
                    form.school,

                  pin:
                    form.pin,

                  subjectsInterested:
                    subjects,
                }),
            }
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            data?.error ||
              'Registration failed.'
          )
        }

        setResult({
          regNumber:
            data.regNumber,

          requiresPayment:
            Boolean(
              data.requiresPayment
            ),

          redirectTo:
            data.redirectTo ||
            (
              data.requiresPayment
                ? '/exam-prep/dashboard/subscription'
                : '/exam-prep/dashboard'
            ),
        })
      } catch (
        err:
          unknown
      ) {
        setError(
          err instanceof
          Error
            ? err.message
            : 'Registration failed.'
        )
      } finally {
        setLoading(
          false
        )
      }
    }

  // ==========================================================
  // REGISTRATION COMPLETE
  // ==========================================================

  if (
    result
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Registration Complete
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Keep your registration number safe. You will use it with your 6-digit PIN to log in.
          </p>

          <div className="mt-5 rounded-2xl bg-slate-950 p-4 font-mono text-xl font-black tracking-wider text-white">
            {result.regNumber}
          </div>

          {result.requiresPayment ? (
            <>
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left">
                <div className="flex gap-3">
                  <CreditCard
                    size={
                      20
                    }
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-black text-blue-900">
                      Subscription required
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Exam Prep is currently a paid service. Select a subscription plan and complete payment to activate your Exam Prep access.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.replace(
                    result.redirectTo
                  )
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <CreditCard
                  size={
                    16
                  }
                />

                Choose Subscription Plan
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                router.replace(
                  result.redirectTo
                )
              }
              className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </div>
    )
  }

  // ==========================================================
  // FORM
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <form
        onSubmit={
          submit
        }
        className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Join Loran Exam Prep
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Practice, compete and receive AI performance coaching.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [
              'fullName',
              'Full Name',
              'text',
            ],
            [
              'email',
              'Email',
              'email',
            ],
            [
              'location',
              'Location',
              'text',
            ],
            [
              'school',
              'School',
              'text',
            ],
          ].map(
            (
              [
                key,
                label,
                type,
              ]
            ) => (
              <label
                key={
                  key
                }
                className="text-xs font-semibold text-slate-600"
              >
                {label}

                <input
                  type={
                    type
                  }
                  required
                  disabled={
                    loading
                  }
                  value={
                    (
                      form as any
                    )[
                      key
                    ]
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      [
                        key
                      ]:
                        event
                          .target
                          .value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </label>
            )
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600">
            Subjects of interest
          </p>

          <div className="mt-3 space-y-4">
            {catalog.map(
              (
                category
              ) => (
                <div
                  key={
                    category.value
                  }
                >
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {category.label}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {category.subjects.map(
                      (
                        subject:
                          string
                      ) => (
                        <button
                          type="button"
                          key={
                            subject
                          }
                          disabled={
                            loading
                          }
                          onClick={() =>
                            toggle(
                              subject
                            )
                          }
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            subjects.includes(
                              subject
                            )
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          {subject}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            6-Digit PIN

            <input
              type="password"
              inputMode="numeric"
              maxLength={
                6
              }
              required
              disabled={
                loading
              }
              value={
                form.pin
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  pin:
                    event
                      .target
                      .value
                      .replace(
                        /\D/g,
                        ''
                      ),
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center font-bold tracking-[0.3em]"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Confirm PIN

            <input
              type="password"
              inputMode="numeric"
              maxLength={
                6
              }
              required
              disabled={
                loading
              }
              value={
                form.confirmPin
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  confirmPin:
                    event
                      .target
                      .value
                      .replace(
                        /\D/g,
                        ''
                      ),
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center font-bold tracking-[0.3em]"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={
            loading
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white disabled:opacity-60"
        >
          {loading && (
            <Loader2
              size={
                15
              }
              className="animate-spin"
            />
          )}

          {loading
            ? 'Creating Account...'
            : 'Register'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}

          <Link
            href="/exam-prep/login"
            className="font-bold text-blue-600"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}