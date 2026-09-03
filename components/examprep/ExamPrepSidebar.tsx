'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  CreditCard,
  History,
  LogOut,
  Menu,
  MessageCircle,
  Target,
  Trophy,
  X,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  useExamPrepStudent,
} from '@/hooks/useExamPrepStudent'

// ============================================================
// TYPES
// ============================================================

type SubscriptionState = {
  isPaid: boolean
  active: boolean
  expired: boolean
  requiresPayment: boolean

  subscription: {
    wasFreeAtRegistration: boolean

    planDuration:
      | '1month'
      | '2months'
      | '3months'
      | 'life'
      | null

    planLabel:
      string | null

    amountPaid: number

    startDate:
      string | null

    endDate:
      string | null

    isLifetime: boolean

    daysRemaining:
      number | null
  }
}

// ============================================================
// NAVIGATION
// ============================================================

const links = [
  {
    href:
      '/exam-prep/dashboard',

    label:
      'Overview',

    icon:
      BarChart3,
  },

  {
    href:
      '/exam-prep/dashboard/take',

    label:
      'Practice Exam',

    icon:
      ClipboardList,
  },

  {
    href:
      '/exam-prep/dashboard/analytics',

    label:
      'AI Performance',

    icon:
      BrainCircuit,
  },

  {
    href:
      '/exam-prep/dashboard/live-exams',

    label:
      'Exam Arena',

    icon:
      Trophy,
  },

  {
    href:
      '/exam-prep/dashboard/discord',

    label:
      'Community',

    icon:
      MessageCircle,
  },

  {
    href:
      '/exam-prep/dashboard/mistakes',

    label:
      'Mistake Bank',

    icon:
      Target,
  },

  {
    href:
      '/exam-prep/dashboard/history',

    label:
      'History',

    icon:
      History,
  },
]

// ============================================================
// PAGE
// ============================================================

export default function ExamPrepSidebar() {
  const pathname =
    usePathname()

  const {
    student,
    logout,
  } =
    useExamPrepStudent()

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    )

  const [
    subscription,
    setSubscription,
  ] =
    useState<
      SubscriptionState | null
    >(
      null
    )

  const [
    loadingSubscription,
    setLoadingSubscription,
  ] =
    useState(
      true
    )

  // ==========================================================
  // LOAD SUBSCRIPTION
  // ==========================================================

  const loadSubscription =
    useCallback(
      async () => {
        try {
          setLoadingSubscription(
            true
          )

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

          /*
           * During logout, expired sessions, or initial auth
           * resolution, the request may legitimately return 401.
           * The dashboard access gate handles redirection.
           */
          if (
            response.status ===
            401
          ) {
            return
          }

          const data =
            await response.json()

          if (
            !response.ok
          ) {
            console.error(
              'Could not load Exam Prep subscription:',
              data
            )

            return
          }

          setSubscription(
            data
          )
        } catch (
          error
        ) {
          console.error(
            'Exam Prep sidebar subscription error:',
            error
          )
        } finally {
          setLoadingSubscription(
            false
          )
        }
      },
      []
    )

  // ==========================================================
  // REFRESH ON ROUTE CHANGE
  // ==========================================================

  useEffect(
    () => {
      loadSubscription()
    },
    [
      loadSubscription,
      pathname,
    ]
  )

  // ==========================================================
  // SUBSCRIPTION LABEL
  // ==========================================================

  const getSubscriptionLabel =
    () => {
      if (
        !subscription
      ) {
        return 'Subscription'
      }

      if (
        !subscription.isPaid
      ) {
        return 'Subscription'
      }

      if (
        subscription
          .subscription
          ?.isLifetime
      ) {
        return 'Subscription'
      }

      if (
        subscription.active &&
        subscription.subscription
          ?.planDuration
      ) {
        return 'Renew Subscription'
      }

      return 'Subscription'
    }

  // ==========================================================
  // SUBSCRIPTION STATUS
  // ==========================================================

  const getSubscriptionStatus =
    () => {
      if (
        loadingSubscription
      ) {
        return {
          text:
            'Checking...',

          className:
            'text-slate-500',
        }
      }

      if (
        !subscription
      ) {
        return {
          text:
            '',

          className:
            'text-slate-500',
        }
      }

      if (
        !subscription.isPaid
      ) {
        return {
          text:
            'Free access',

          className:
            'text-emerald-400',
        }
      }

      if (
        subscription
          .subscription
          ?.wasFreeAtRegistration
      ) {
        return {
          text:
            'Free access',

          className:
            'text-emerald-400',
        }
      }

      if (
        subscription
          .subscription
          ?.isLifetime
      ) {
        return {
          text:
            'Lifetime',

          className:
            'text-amber-400',
        }
      }

      if (
        subscription.active
      ) {
        const days =
          subscription
            .subscription
            ?.daysRemaining

        if (
          typeof days ===
          'number'
        ) {
          if (
            days <=
            5
          ) {
            return {
              text:
                `${days} day${
                  days ===
                  1
                    ? ''
                    : 's'
                } left`,

              className:
                'text-amber-400',
            }
          }

          return {
            text:
              `${days} days left`,

            className:
              'text-emerald-400',
          }
        }

        return {
          text:
            'Active',

          className:
            'text-emerald-400',
        }
      }

      if (
        subscription.expired
      ) {
        return {
          text:
            'Expired',

          className:
            'text-red-400',
        }
      }

      if (
        subscription.requiresPayment
      ) {
        return {
          text:
            'Payment required',

          className:
            'text-red-400',
        }
      }

      return {
        text:
          'Inactive',

        className:
          'text-slate-500',
      }
    }

  const subscriptionStatus =
    getSubscriptionStatus()

  // ==========================================================
  // ACTIVE ROUTE
  // ==========================================================

  const isActive =
    (
      href:
        string
    ) => {
      if (
        href ===
        '/exam-prep/dashboard'
      ) {
        return (
          pathname ===
          href
        )
      }

      return pathname.startsWith(
        href
      )
    }

  const subscriptionActive =
    pathname.startsWith(
      '/exam-prep/dashboard/subscription'
    ) ||
    pathname.startsWith(
      '/exam-prep/dashboard/subscribe'
    )

  // ==========================================================
  // NAV CONTENT
  // ==========================================================

  const nav = (
    <>
      {/* ======================================================
          BRAND
      ====================================================== */}

      <div className="border-b border-slate-800 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">
          Loran EduHub
        </p>

        <p className="mt-1 text-lg font-bold text-white">
          Exam Prep
        </p>
      </div>

      {/* ======================================================
          LINKS
      ====================================================== */}

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {links.map(
            ({
              href,
              label,
              icon:
                Icon,
            }) => {
              const active =
                isActive(
                  href
                )

              return (
                <Link
                  key={
                    href
                  }
                  href={
                    href
                  }
                  onClick={() =>
                    setOpen(
                      false
                    )
                  }
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon
                    size={
                      17
                    }
                    className="shrink-0"
                  />

                  <span>
                    {label}
                  </span>

                  {label ===
                    'Community' && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                        active
                          ? 'bg-white/15 text-white'
                          : 'bg-[#5865F2]/15 text-indigo-300'
                      }`}
                    >
                      Discord
                    </span>
                  )}
                </Link>
              )
            }
          )}
        </div>

        {/* ====================================================
            COMMUNITY INFO
        ===================================================== */}

        <div className="mx-1 mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5865F2] text-white">
              <MessageCircle
                size={
                  15
                }
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black text-white">
                Academic Community
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                Ask tutors questions and learn with other Exam Prep students.
              </p>

              <Link
                href="/exam-prep/dashboard/discord"
                onClick={() =>
                  setOpen(
                    false
                  )
                }
                className="mt-2 inline-flex text-[10px] font-black text-indigo-300 transition hover:text-indigo-200"
              >
                Open Community →
              </Link>
            </div>
          </div>
        </div>

        {/* ====================================================
            SUBSCRIPTION
        ===================================================== */}

        <div className="my-3 border-t border-slate-800" />

        <Link
          href="/exam-prep/dashboard/subscription"
          onClick={() =>
            setOpen(
              false
            )
          }
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
            subscriptionActive
              ? 'bg-blue-600 text-white shadow-sm'
              : subscription
                    ?.requiresPayment
                ? 'bg-red-500/10 text-red-200 hover:bg-red-500/15'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CreditCard
            size={
              17
            }
            className="shrink-0"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {getSubscriptionLabel()}
            </p>

            {subscriptionStatus.text && (
              <p
                className={`mt-0.5 truncate text-[10px] font-medium ${
                  subscriptionActive
                    ? 'text-blue-100'
                    : subscriptionStatus.className
                }`}
              >
                {subscriptionStatus.text}
              </p>
            )}
          </div>

          {subscription
            ?.requiresPayment && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
          )}

          {subscription
            ?.active &&
            subscription.isPaid &&
            !subscription
              .subscription
              ?.isLifetime &&
            !subscription
              .subscription
              ?.wasFreeAtRegistration && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            )}
        </Link>
      </div>

      {/* ======================================================
          STUDENT
      ====================================================== */}

      <div className="border-t border-slate-800 p-4">
        {student && (
          <div className="mb-3 rounded-xl bg-slate-900 p-3">
            <p className="truncate text-sm font-semibold text-white">
              {student.fullName}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">
              {student.regNumber}
            </p>

            {subscription && (
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    subscription.active
                      ? 'bg-emerald-400'
                      : subscription.requiresPayment
                        ? 'bg-red-400'
                        : 'bg-slate-500'
                  }`}
                />

                <p
                  className={`text-[10px] font-medium ${
                    subscription.active
                      ? 'text-emerald-400'
                      : subscription.requiresPayment
                        ? 'text-red-400'
                        : 'text-slate-500'
                  }`}
                >
                  {subscription.active
                    ? 'Exam Prep access active'
                    : subscription.requiresPayment
                      ? 'Subscription required'
                      : 'Exam Prep account'}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={
            logout
          }
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut
            size={
              15
            }
          />

          Log out
        </button>
      </div>
    </>
  )

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* MOBILE MENU */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            true
          )
        }
        className="fixed left-4 top-4 z-40 rounded-xl bg-slate-950 p-2.5 text-white shadow-lg lg:hidden"
        aria-label="Open Exam Prep menu"
      >
        <Menu
          size={
            20
          }
        />
      </button>

      {/* DESKTOP */}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 lg:flex">
        {nav}
      </aside>

      {/* MOBILE DRAWER */}

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() =>
              setOpen(
                false
              )
            }
          />

          <aside className="relative flex h-full w-[86%] max-w-72 flex-col bg-slate-950 shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setOpen(
                  false
                )
              }
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close Exam Prep menu"
            >
              <X
                size={
                  18
                }
              />
            </button>

            {nav}
          </aside>
        </div>
      )}
    </>
  )
}