'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Award,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'

interface OverviewData {
  student: {
    firstName: string
    lastName: string
    phone: string
    state: string
    profileImage: string | null
    hasUsedFreeTrial: boolean
  }
  subscription: {
    status: string
    plan: string | null
    endDate: string | null
    daysLeft: number
    secondsLeft: number
  }
  enrollments: {
    _id: string
    courseName: string
    courseCategory: string
    tutorName: string
    tutorImage: string | null
    plan: string
    status: string
    startDate: string
    endDate: string
  }[]
  exams: {
    _id: string
    title: string
    courseName: string
    duration: number
    scheduledDate: string | null
  }[]
  recentGrades: {
    _id: string
    score: number
    total: number
    percentage: number
    gradedAt: string
  }[]
  stats: {
    totalCourses: number
    totalExams: number
    averageScore: number | null
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: 'bg-blue-100 text-blue-700',
  igcse: 'bg-purple-100 text-purple-700',
  language: 'bg-green-100 text-green-700',
  ielts: 'bg-yellow-100 text-yellow-700',
  'jamb-waec': 'bg-orange-100 text-orange-700',
  diploma: 'bg-pink-100 text-pink-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tech',
  igcse: 'IGCSE',
  language: 'Language',
  ielts: 'IELTS',
  'jamb-waec': 'JAMB/WAEC',
  diploma: 'EduTech',
}

const PLAN_LABELS: Record<string, string> = {
  trial: 'Free Trial',
  '3months': '3 Months',
  '6months': '6 Months',
  '1year': '1 Year Diploma',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100' },
  trial: { label: 'Trial', color: 'text-blue-700', bg: 'bg-blue-100' },
  paused: { label: 'Paused', color: 'text-orange-700', bg: 'bg-orange-100' },
  expired: { label: 'Expired', color: 'text-red-700', bg: 'bg-red-100' },
  none: { label: 'No Plan', color: 'text-gray-700', bg: 'bg-gray-100' },
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function formatTime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

function ScoreBar({ percentage }: { percentage: number }) {
  const color =
    percentage >= 70
      ? 'bg-green-500'
      : percentage >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">
        {percentage}%
      </span>
    </div>
  )
}

export default function StudentOverview() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/student/overview')
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error)
        } else {
          setData(d)
          setSecondsLeft(d.subscription.secondsLeft)
        }
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  // Live countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [secondsLeft > 0])

  const isExpiredOrPaused =
    data?.subscription.status === 'expired' ||
    data?.subscription.status === 'paused' ||
    data?.subscription.status === 'none'

  if (loading) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-gray-900 font-semibold">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const statusConfig =
    STATUS_CONFIG[data.subscription.status] ?? STATUS_CONFIG.none

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Expired/Paused Banner ── */}
        {isExpiredOrPaused && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-800 text-sm">
                {data.subscription.status === 'paused'
                  ? 'Your subscription is paused'
                  : 'Your subscription has expired'}
              </p>
              <p className="text-red-600 text-xs mt-0.5">
                Renew to regain access to your courses, exams, and Discord server.
              </p>
            </div>
            <Link
              href="/dashboard/renew"
              className="shrink-0 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              Renew Now
            </Link>
          </div>
        )}

        {/* ── Row 1: Welcome + Subscription ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Student profile card */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {data.student.profileImage ? (
                <img
                  src={data.student.profileImage}
                  alt="Profile"
                  className="w-14 h-14 rounded-2xl object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {getInitials(data.student.firstName, data.student.lastName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-base leading-tight">
                  {data.student.firstName} {data.student.lastName}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">{data.student.state}</p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 ${statusConfig.bg} ${statusConfig.color}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
              {[
                { label: 'Courses', value: data.stats.totalCourses },
                { label: 'Exams', value: data.stats.totalExams },
                {
                  label: 'Avg Score',
                  value:
                    data.stats.averageScore !== null
                      ? `${data.stats.averageScore}%`
                      : '—',
                },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="font-bold text-gray-900 text-lg">{stat.value}</p>
                  <p className="text-gray-400 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription countdown */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">
                    Subscription
                  </p>
                  <p className="text-white font-bold text-xl mt-0.5">
                    {data.subscription.plan
                      ? PLAN_LABELS[data.subscription.plan]
                      : 'No active plan'}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    data.subscription.status === 'active' ||
                    data.subscription.status === 'trial'
                      ? 'bg-green-400/20 text-green-200 border border-green-400/30'
                      : 'bg-red-400/20 text-red-200 border border-red-400/30'
                  }`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {data.subscription.endDate && secondsLeft > 0 ? (
                <>
                  <div className="bg-white/10 rounded-xl p-4 mb-3">
                    <p className="text-blue-200 text-xs mb-1">Time remaining</p>
                    <p className="font-mono font-bold text-2xl sm:text-3xl text-white tracking-wider">
                      {formatTime(secondsLeft)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Expires{' '}
                      {new Date(data.subscription.endDate).toLocaleDateString(
                        'en-NG',
                        { day: 'numeric', month: 'long', year: 'numeric' }
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-blue-200 text-sm">
                    {data.subscription.status === 'none'
                      ? 'No active subscription'
                      : 'Subscription has ended'}
                  </p>
                  <Link
                    href="/dashboard/renew"
                    className="inline-block mt-2 px-4 py-2 bg-white text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                  >
                    Renew Subscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 2: Stats cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Active Courses',
              value: data.stats.totalCourses,
              icon: BookOpen,
              color: 'bg-blue-50 text-blue-600',
              href: '/dashboard/courses',
            },
            {
              label: 'Available Exams',
              value: data.stats.totalExams,
              icon: FileText,
              color: 'bg-purple-50 text-purple-600',
              href: '/dashboard/exams',
            },
            {
              label: 'Average Score',
              value:
                data.stats.averageScore !== null
                  ? `${data.stats.averageScore}%`
                  : '—',
              icon: TrendingUp,
              color: 'bg-green-50 text-green-600',
              href: '/dashboard/scores',
            },
            {
              label: 'Days Left',
              value: data.subscription.daysLeft,
              icon: Clock,
              color: 'bg-orange-50 text-orange-600',
              href: '/dashboard/settings',
            },
          ].map(stat => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-all group"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}
              >
                <stat.icon size={18} />
              </div>
              <p className="font-bold text-gray-900 text-xl">{stat.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* ── Row 3: Courses + Exams ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Enrolled courses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">My Courses</h3>
              <Link
                href="/dashboard/courses"
                className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {data.enrollments.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No courses enrolled yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.enrollments.slice(0, 4).map(enrollment => {
                  const catColor =
                    CATEGORY_COLORS[enrollment.courseCategory] ??
                    'bg-gray-100 text-gray-600'
                  const statusConf =
                    STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.none
                  return (
                    <div
                      key={enrollment._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {enrollment.tutorImage ? (
                        <img
                          src={enrollment.tutorImage}
                          alt={enrollment.tutorName}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <User size={16} className="text-blue-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {enrollment.courseName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {enrollment.tutorName}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}
                        >
                          {CATEGORY_LABELS[enrollment.courseCategory] ??
                            enrollment.courseCategory}
                        </span>
                        <span
                          className={`text-xs font-medium ${statusConf.color}`}
                        >
                          {statusConf.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Available exams */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Available Exams</h3>
              <Link
                href="/dashboard/exams"
                className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {data.exams.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No exams available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.exams.slice(0, 4).map(exam => (
                  <div
                    key={exam._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {exam.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {exam.courseName} · {exam.duration} mins
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/exams/${exam._id}`}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isExpiredOrPaused
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      Start
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 4: Recent scores + Quick links ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent grades */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Recent Scores</h3>
              <Link
                href="/dashboard/scores"
                className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {data.recentGrades.length === 0 ? (
              <div className="py-8 text-center">
                <Award className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No scores recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentGrades.map((grade, idx) => (
                  <div key={grade._id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-gray-700">
                        Exam {idx + 1}
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {grade.score}/{grade.total}
                      </p>
                    </div>
                    <ScoreBar percentage={grade.percentage} />
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(grade.gradedAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-base mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                {
                  label: 'Join Discord Server',
                  desc: 'Connect with tutors',
                  href: '/dashboard/discord',
                  icon: Wifi,
                  color: 'text-indigo-600 bg-indigo-50',
                },
                {
                  label: 'View All Exams',
                  desc: 'Take available exams',
                  href: '/dashboard/exams',
                  icon: FileText,
                  color: 'text-purple-600 bg-purple-50',
                },
                {
                  label: 'My Scores',
                  desc: 'Track your progress',
                  href: '/dashboard/scores',
                  icon: Award,
                  color: 'text-green-600 bg-green-50',
                },
                {
                  label: 'Contact Support',
                  desc: 'Get help from our team',
                  href: '/dashboard/support',
                  icon: CheckCircle,
                  color: 'text-blue-600 bg-blue-50',
                },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}
                  >
                    <action.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-400">{action.desc}</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-gray-300 group-hover:text-blue-400 transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}