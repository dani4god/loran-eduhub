// app/exam-prep/dashboard/discord/page.tsx

'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react'

import Link from 'next/link'

import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Loader2,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type DiscordInfo = {
  success: boolean

  isConnected:
    boolean

  discordUsername:
    string | null

  discordRoles:
    string[]

  hasCommunityAccess:
    boolean

  requiresSubscription:
    boolean

  communityUrl:
    string | null

  student?: {
    fullName:
      string

    regNumber:
      string
  }
}

// ============================================================
// ERROR MESSAGE
// ============================================================

function getOAuthErrorMessage(
  error:
    string | null
) {
  if (
    !error
  ) {
    return ''
  }

  if (
    error ===
    'cancelled'
  ) {
    return 'Discord connection was cancelled.'
  }

  if (
    error ===
    'session'
  ) {
    return 'Your Exam Prep session expired while connecting Discord. Please log in again.'
  }

  if (
    error ===
    'subscription'
  ) {
    return 'An active Exam Prep subscription is required to access the Discord academic community.'
  }

  if (
    error ===
    'state'
  ) {
    return 'The Discord connection request expired or could not be verified. Please try again.'
  }

  if (
    error ===
    'account'
  ) {
    return 'The Discord connection could not be matched to your Exam Prep account.'
  }

  if (
    error ===
    'token' ||
    error ===
      'discord_user'
  ) {
    return 'Discord could not finish authorizing your account. Please try connecting again.'
  }

  return 'We could not finish connecting Discord. Please try again.'
}

// ============================================================
// CONTENT
// ============================================================

function ExamPrepDiscordContent() {
  const router =
    useRouter()

  const searchParams =
    useSearchParams()

  const [
    info,
    setInfo,
  ] =
    useState<
      DiscordInfo | null
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
    syncing,
    setSyncing,
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
    successMessage,
    setSuccessMessage,
  ] =
    useState('')

  // ==========================================================
  // LOAD
  // ==========================================================

  const load =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          )

          const response =
            await fetch(
              '/api/exam-prep/discord',
              {
                cache:
                  'no-store',
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
                'Could not load community status.'
            )
          }

          setInfo(
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
              : 'Could not load community status.'
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

  // ==========================================================
  // CALLBACK MESSAGES
  // ==========================================================

  useEffect(
    () => {
      const connected =
        searchParams.get(
          'connected'
        )

      const callbackError =
        searchParams.get(
          'error'
        )

      const sync =
        searchParams.get(
          'sync'
        )

      if (
        connected ===
        '1'
      ) {
        if (
          sync ===
          'failed'
        ) {
          setSuccessMessage(
            'Your Discord account was linked. Role synchronization needs another attempt.'
          )
        } else {
          setSuccessMessage(
            'Discord connected successfully. Welcome to the Loran Exam Prep community!'
          )
        }
      }

      if (
        callbackError
      ) {
        setError(
          getOAuthErrorMessage(
            callbackError
          )
        )
      }
    },
    [
      searchParams,
    ]
  )

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      load()
    },
    [
      load,
    ]
  )

  // ==========================================================
  // CONNECT
  // ==========================================================

  const connectDiscord =
    () => {
      setError('')

      window.location.href =
        '/api/exam-prep/discord/connect'
    }

  // ==========================================================
  // RESYNC
  // ==========================================================

  const resync =
    async () => {
      if (
        syncing
      ) {
        return
      }

      setSyncing(
        true
      )

      setError('')
      setSuccessMessage('')

      try {
        const response =
          await fetch(
            '/api/exam-prep/discord/sync',
            {
              method:
                'POST',
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
              'Could not synchronize Discord access.'
          )
        }

        setInfo(
          (
            current
          ) =>
            current
              ? {
                  ...current,

                  discordRoles:
                    Array.isArray(
                      result
                        ?.assignedRoles
                    )
                      ? result.assignedRoles
                      : current.discordRoles,

                  hasCommunityAccess:
                    Boolean(
                      result
                        ?.hasCommunityAccess
                    ),

                  requiresSubscription:
                    Boolean(
                      result
                        ?.requiresSubscription
                    ),
                }
              : current
        )

        if (
          result
            ?.hasCommunityAccess
        ) {
          setSuccessMessage(
            'Your Discord community access is synchronized.'
          )
        } else {
          setSuccessMessage(
            'Discord was synchronized. Renew your Exam Prep subscription to restore the Exam Preparation Student role.'
          )
        }
      } catch (
        err:
          unknown
      ) {
        setError(
          err instanceof
          Error
            ? err.message
            : 'Could not synchronize Discord access.'
        )
      } finally {
        setSyncing(
          false
        )
      }
    }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading your community...
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* HERO */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white shadow-xl">
          <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#5865F2]/20 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                <MessageSquare
                  size={
                    13
                  }
                />

                Loran Academic Community
              </div>

              <h1 className="mt-5 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                Learning does not have to stop when the exam ends.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Connect your Exam Prep account to our Discord community, ask questions when you are stuck,
                interact with professional tutors, meet other serious students and grow academically together.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                  Tutor Support
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                  Student Community
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                  Exam Discussions
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                  Academic Growth
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MESSAGES */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2
              size={
                18
              }
              className="mt-0.5 shrink-0"
            />

            {successMessage}
          </div>
        )}

        {/* BENEFITS */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              More than an exam platform
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your Loran Exam Prep subscription also connects you to people who can help you improve.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <HelpCircle
                  size={
                    21
                  }
                />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                Ask Questions
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Ask about difficult questions, topics and concepts whenever you need help.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <GraduationCap
                  size={
                    21
                  }
                />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                Professional Tutors
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Get explanations and academic guidance from experienced tutors in the community.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users
                  size={
                    21
                  }
                />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                Learn Together
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Study alongside other students preparing for important examinations.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Sparkles
                  size={
                    21
                  }
                />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                Grow Academically
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Exchange ideas, discover study techniques and build stronger academic habits.
              </p>
            </div>
          </div>
        </section>

        {/* ACCOUNT CONNECTION */}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5865F2]/10 text-[#5865F2]">
                <MessageSquare
                  size={
                    21
                  }
                />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  Discord Community Access
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Link Discord directly to your Loran Exam Prep account.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">

            {/* NO SUBSCRIPTION */}

            {info &&
              !info.hasCommunityAccess && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <ShieldCheck
                    size={
                      25
                    }
                    className="text-amber-600"
                  />

                  <h3 className="mt-3 font-black text-amber-950">
                    Exam Prep subscription required
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-700">
                    Community access is one of the benefits of an active Loran Exam Prep account.
                    Subscribe or renew your plan to receive the protected Exam Preparation Student role.
                  </p>

                  <Link
                    href="/exam-prep/dashboard/subscription"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-700"
                  >
                    Subscribe / Renew

                    <ArrowRight
                      size={
                        15
                      }
                    />
                  </Link>
                </div>
              )}

            {/* NOT CONNECTED */}

            {info &&
              info.hasCommunityAccess &&
              !info.isConnected && (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865F2]/10 text-[#5865F2]">
                    <MessageSquare
                      size={
                        30
                      }
                    />
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-900">
                    Connect your Discord account
                  </h3>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Your Discord identity will be linked to your current Exam Prep account.
                    You will automatically be added to the Loran EduHub server and receive your student access role.
                  </p>

                  <button
                    type="button"
                    onClick={
                      connectDiscord
                    }
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4752C4]"
                  >
                    <MessageSquare
                      size={
                        17
                      }
                    />

                    Connect Discord
                  </button>

                  <p className="mx-auto mt-3 max-w-lg text-[11px] leading-5 text-slate-400">
                    Discord will ask you to authorize Loran EduHub to identify your account
                    and add you to the community server.
                  </p>
                </div>
              )}

            {/* CONNECTED */}

            {info &&
              info.isConnected && (
                <div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5865F2] text-white">
                        <MessageSquare
                          size={
                            20
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">
                          @
                          {info.discordUsername ||
                            'Discord User'}
                        </p>

                        <div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2
                            size={
                              12
                            }
                          />

                          Discord connected
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {info.communityUrl &&
                        info.hasCommunityAccess && (
                          <a
                            href={
                              info.communityUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#4752C4]"
                          >
                            <MessageCircle
                              size={
                                15
                              }
                            />

                            Open Community

                            <ExternalLink
                              size={
                                13
                              }
                            />
                          </a>
                        )}

                      <button
                        type="button"
                        onClick={
                          resync
                        }
                        disabled={
                          syncing
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={
                            14
                          }
                          className={
                            syncing
                              ? 'animate-spin'
                              : ''
                          }
                        />

                        {syncing
                          ? 'Syncing...'
                          : 'Re-sync Access'}
                      </button>
                    </div>
                  </div>

                  {/* ROLES */}

                  <div className="mt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Your Community Roles
                    </p>

                    {info.discordRoles &&
                    info.discordRoles.length >
                      0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {info.discordRoles.map(
                          (
                            role
                          ) => (
                            <span
                              key={
                                role
                              }
                              className="inline-flex items-center gap-2 rounded-full bg-[#5865F2]/10 px-3 py-1.5 text-xs font-bold text-[#5865F2]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#5865F2]" />

                              {role}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        No managed Discord roles are currently assigned.
                      </p>
                    )}
                  </div>

                  {!info.hasCommunityAccess && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-black text-amber-900">
                        Your Exam Preparation Student role is inactive.
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Renew your Exam Prep subscription and then click Re-sync Access to restore it.
                      </p>

                      <Link
                        href="/exam-prep/dashboard/subscription"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-amber-800 hover:underline"
                      >
                        Renew Subscription

                        <ArrowRight
                          size={
                            13
                          }
                        />
                      </Link>
                    </div>
                  )}
                </div>
              )}
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <BookOpen
              size={
                19
              }
              className="text-blue-600"
            />

            <h2 className="font-black text-slate-900">
              Getting started with Discord
            </h2>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone
                  size={
                    15
                  }
                  className="text-blue-600"
                />

                <p className="text-xs font-black uppercase tracking-wide text-slate-700">
                  On your phone
                </p>
              </div>

              <ol className="mt-3 space-y-2 pl-5 text-xs leading-5 text-slate-600 [list-style:decimal]">
                <li>
                  Download Discord from the Apple App Store or Google Play Store.
                </li>

                <li>
                  Create a Discord account or sign into your existing one.
                </li>

                <li>
                  Verify your Discord email address if Discord asks you to.
                </li>

                <li>
                  Return here and click Connect Discord.
                </li>

                <li>
                  Approve the authorization request and Loran EduHub will connect your account to the community.
                </li>
              </ol>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <MessageSquare
                  size={
                    15
                  }
                  className="text-[#5865F2]"
                />

                <p className="text-xs font-black uppercase tracking-wide text-slate-700">
                  After connecting
                </p>
              </div>

              <ol className="mt-3 space-y-2 pl-5 text-xs leading-5 text-slate-600 [list-style:decimal]">
                <li>
                  Your Discord account is linked to your Loran Exam Prep profile.
                </li>

                <li>
                  Loran automatically adds you to the Discord community.
                </li>

                <li>
                  Your Exam Preparation Student role unlocks the appropriate community areas.
                </li>

                <li>
                  Open the community and interact with students and tutors.
                </li>

                <li>
                  If your subscription changes, use Re-sync Access to refresh your Discord permissions.
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck
                size={
                  17
                }
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <p className="text-xs leading-5 text-slate-600">
                <span className="font-black text-slate-800">
                  Account security:
                </span>{' '}
                Discord does not receive your Exam Prep PIN. Loran only uses Discord authorization to identify your Discord account,
                add you to the community and manage the roles associated with your Loran account.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ============================================================
// PAGE WITH SUSPENSE
// ============================================================

export default function ExamPrepDiscordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading community...
            </p>
          </div>
        </div>
      }
    >
      <ExamPrepDiscordContent />
    </Suspense>
  )
}