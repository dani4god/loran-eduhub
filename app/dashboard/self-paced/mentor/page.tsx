// app/dashboard/self-paced/mentor/page.tsx

'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface MentorPreference {
  enabled: boolean

  whatsappPhone: string

  consentGiven: boolean
  consentGivenAt: string | null

  studyReminders: boolean
  progressMessages: boolean
  assessmentSupport: boolean
  feedbackRequests: boolean

  preferredTime: string
  timezone: string
}

// ============================================================
// DEFAULTS
// ============================================================

const DEFAULT_PREFERENCE:
  MentorPreference = {
    enabled: false,

    whatsappPhone: '',

    consentGiven: false,
    consentGivenAt: null,

    studyReminders: true,
    progressMessages: true,
    assessmentSupport: true,
    feedbackRequests: true,

    preferredTime: '18:00',

    timezone: 'Africa/Lagos',
  }

// ============================================================
// PAGE
// ============================================================

export default function WhatsAppMentorPage() {
  const [
    preference,
    setPreference,
  ] =
    useState<MentorPreference>(
      DEFAULT_PREFERENCE
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  // ==========================================================
  // LOAD SETTINGS
  // ==========================================================

  const loadPreferences =
    useCallback(async () => {
      try {
        setError('')

        const response =
          await fetch(
            '/api/self-paced/mentor/preferences',
            {
              cache: 'no-store',
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data?.error ||
              'Unable to load mentor settings.'
          )
        }

        setPreference({
          ...DEFAULT_PREFERENCE,
          ...(data.preference || {}),
        })
      } catch (error) {
        console.error(
          'Failed to load mentor settings:',
          error
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load mentor settings.'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  // ==========================================================
  // UPDATE FIELD
  // ==========================================================

  function updatePreference<
    K extends keyof MentorPreference
  >(
    key: K,
    value: MentorPreference[K]
  ) {
    setPreference(
      (current) => ({
        ...current,
        [key]: value,
      })
    )

    setSuccess('')
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  async function savePreferences() {
    if (saving) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (
        preference.enabled &&
        !preference.whatsappPhone.trim()
      ) {
        setError(
          'Enter your WhatsApp number before enabling mentoring.'
        )

        return
      }

      const response =
        await fetch(
          '/api/self-paced/mentor/preferences',
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              enabled:
                preference.enabled,

              whatsappPhone:
                preference.whatsappPhone,

              studyReminders:
                preference.studyReminders,

              progressMessages:
                preference.progressMessages,

              assessmentSupport:
                preference.assessmentSupport,

              feedbackRequests:
                preference.feedbackRequests,

              preferredTime:
                preference.preferredTime,

              timezone:
                preference.timezone,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Unable to save mentor settings.'
        )
      }

      if (data.preference) {
        setPreference({
          ...DEFAULT_PREFERENCE,
          ...data.preference,
        })
      }

      setSuccess(
        data.message ||
          'Your WhatsApp mentor settings have been saved.'
      )
    } catch (error) {
      console.error(
        'Failed to save mentor settings:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to save mentor settings.'
      )
    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center lg:min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading mentor settings...
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <MessageCircle size={20} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Loran EduHub
              </p>

              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                WhatsApp Course Mentor
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-gray-500">
            Get study reminders, course progress
            check-ins and learning support directly
            on WhatsApp while completing your
            self-paced courses.
          </p>
        </div>

        {/* ===================================================
            STATUS
        ==================================================== */}

        <div
          className={`mb-5 rounded-2xl border p-4 ${
            preference.enabled
              ? 'border-green-100 bg-green-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  preference.enabled
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Bot size={20} />
              </div>

              <div>
                <p className="font-bold text-gray-900">
                  WhatsApp mentoring
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {preference.enabled
                    ? 'Your mentor is enabled and can support you as you progress through your courses.'
                    : 'Enable mentoring to receive personalized course support on WhatsApp.'}
                </p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 self-start sm:self-auto">
              <span
                className={`text-xs font-bold ${
                  preference.enabled
                    ? 'text-green-700'
                    : 'text-gray-500'
                }`}
              >
                {preference.enabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>

              <input
                type="checkbox"
                className="peer sr-only"
                checked={
                  preference.enabled
                }
                onChange={(event) =>
                  updatePreference(
                    'enabled',
                    event.target.checked
                  )
                }
              />

              <div className="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-green-600 peer-focus:ring-2 peer-focus:ring-green-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>

        {/* ===================================================
            ERROR / SUCCESS
        ==================================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-5">

          {/* =================================================
              SETTINGS
          ================================================== */}

          <div className="space-y-5 lg:col-span-3">

            {/* WHATSAPP NUMBER */}

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MessageCircle
                  size={17}
                  className="text-green-600"
                />

                <h2 className="font-bold text-gray-900">
                  WhatsApp number
                </h2>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Phone number
                </span>

                <input
                  type="tel"
                  value={
                    preference.whatsappPhone
                  }
                  onChange={(event) =>
                    updatePreference(
                      'whatsappPhone',
                      event.target.value
                    )
                  }
                  placeholder="e.g. +2348031234567"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <p className="mt-2 text-[11px] leading-5 text-gray-400">
                Use the phone number connected to
                your WhatsApp account. Nigerian
                numbers can also be entered in the
                normal 080... format.
              </p>
            </section>

            {/* MESSAGE TYPES */}

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-bold text-gray-900">
                  What should your mentor help with?
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Choose which automated mentoring
                  messages you want to receive.
                </p>
              </div>

              <div className="space-y-3">
                <PreferenceToggle
                  icon={
                    <Bell size={17} />
                  }
                  title="Study reminders"
                  description="Helpful reminders when you have not continued your course."
                  checked={
                    preference.studyReminders
                  }
                  onChange={(checked) =>
                    updatePreference(
                      'studyReminders',
                      checked
                    )
                  }
                />

                <PreferenceToggle
                  icon={
                    <Target size={17} />
                  }
                  title="Progress messages"
                  description="Encouragement when you complete lessons, weeks and important milestones."
                  checked={
                    preference.progressMessages
                  }
                  onChange={(checked) =>
                    updatePreference(
                      'progressMessages',
                      checked
                    )
                  }
                />

                <PreferenceToggle
                  icon={
                    <Sparkles size={17} />
                  }
                  title="Assessment support"
                  description="Study guidance after difficult or unsuccessful assessment attempts."
                  checked={
                    preference.assessmentSupport
                  }
                  onChange={(checked) =>
                    updatePreference(
                      'assessmentSupport',
                      checked
                    )
                  }
                />

                <PreferenceToggle
                  icon={
                    <MessageSquareText
                      size={17}
                    />
                  }
                  title="Feedback requests"
                  description="Occasional questions about your course experience and where you need help."
                  checked={
                    preference.feedbackRequests
                  }
                  onChange={(checked) =>
                    updatePreference(
                      'feedbackRequests',
                      checked
                    )
                  }
                />
              </div>
            </section>

            {/* DELIVERY TIME */}

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Clock
                  size={17}
                  className="text-blue-600"
                />

                <div>
                  <h2 className="font-bold text-gray-900">
                    Preferred mentoring time
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    We'll use this when scheduling
                    non-urgent mentoring messages.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Preferred time
                  </span>

                  <input
                    type="time"
                    value={
                      preference.preferredTime
                    }
                    onChange={(event) =>
                      updatePreference(
                        'preferredTime',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Timezone
                  </span>

                  <select
                    value={
                      preference.timezone
                    }
                    onChange={(event) =>
                      updatePreference(
                        'timezone',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Africa/Lagos">
                      West Africa Time
                      (Africa/Lagos)
                    </option>

                    <option value="Europe/London">
                      London
                    </option>

                    <option value="America/New_York">
                      New York
                    </option>

                    <option value="America/Chicago">
                      Chicago
                    </option>

                    <option value="America/Los_Angeles">
                      Los Angeles
                    </option>

                    <option value="Asia/Dubai">
                      Dubai
                    </option>
                  </select>
                </label>
              </div>
            </section>

            {/* SAVE */}

            <button
              type="button"
              onClick={() =>
                void savePreferences()
              }
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {saving
                ? 'Saving...'
                : 'Save Mentor Settings'}
            </button>
          </div>

          {/* =================================================
              INFO
          ================================================== */}

          <div className="space-y-5 lg:col-span-2">

            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <Bot
                size={24}
                className="mb-3 text-blue-600"
              />

              <h2 className="font-bold text-gray-900">
                Your learning companion
              </h2>

              <p className="mt-2 text-xs leading-6 text-gray-600">
                Loran Mentor uses your actual
                self-paced course progress to make
                its guidance more relevant.
              </p>

              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <InfoRow text="Reminds you when your studies have been inactive." />

                <InfoRow text="Recognizes completed weeks and assessment progress." />

                <InfoRow text="Checks whether you're having difficulty with your course." />

                <InfoRow text="Lets you reply through WhatsApp when you need help." />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <ShieldCheck
                size={22}
                className="mb-3 text-green-600"
              />

              <h2 className="font-bold text-gray-900">
                You're in control
              </h2>

              <p className="mt-2 text-xs leading-6 text-gray-500">
                WhatsApp mentoring is optional.
                You can turn it off from this page
                whenever you no longer want
                automated mentoring messages.
              </p>
            </section>

            {preference.consentGiven &&
              preference.consentGivenAt && (
                <section className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-xs font-bold text-green-700">
                    Mentoring permission active
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-green-600">
                    You previously enabled WhatsApp
                    mentoring for this account.
                  </p>
                </section>
              )}
          </div>
        </div>
      </div>
    </main>
  )
}

// ============================================================
// PREFERENCE TOGGLE
// ============================================================

function PreferenceToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (
    checked: boolean
  ) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-3.5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {title}
          </p>

          <p className="mt-0.5 text-[11px] leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked
            )
          }
        />

        <div className="relative h-5 w-9 rounded-full bg-gray-300 transition peer-checked:bg-blue-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
      </label>
    </div>
  )
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  text,
}: {
  text: string
}) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2
        size={14}
        className="mt-0.5 shrink-0 text-blue-600"
      />

      <span className="leading-5">
        {text}
      </span>
    </div>
  )
}