'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardList, CheckCircle, Clock, AlertCircle,
  Award, ChevronDown, ChevronUp, Send, BookOpen,
} from 'lucide-react'

interface AssignmentData {
  _id: string
  title: string
  description: string
  instructions: string
  totalScore: number
  dueDate: string | null
  courseName: string
  courseCategory: string
  tutorName: string
  isOverdue: boolean
  submission: {
    _id: string
    submittedAt: string
    status: 'submitted' | 'graded'
    score: number | null
    feedback: string
    gradedAt: string | null
    percentage: number | null
  } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: 'bg-blue-50 text-blue-700',
  igcse: 'bg-purple-50 text-purple-700',
  language: 'bg-green-50 text-green-700',
  ielts: 'bg-yellow-50 text-yellow-700',
  'jamb-waec': 'bg-orange-50 text-orange-700',
  diploma: 'bg-pink-50 text-pink-700',
}

function ScoreBar({ percentage }: { percentage: number }) {
  const color =
    percentage >= 70 ? 'bg-green-500'
    : percentage >= 50 ? 'bg-yellow-500'
    : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{percentage}%</span>
    </div>
  )
}

function AssignmentCard({ assignment }: { assignment: AssignmentData }) {
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const catColor = CATEGORY_COLORS[assignment.courseCategory] ?? 'bg-gray-50 text-gray-700'
  const isGraded = assignment.submission?.status === 'graded'
  const isSubmitted = !!assignment.submission

  const handleSubmit = async () => {
    if (!confirm('Confirm submission? Make sure you have sent your work to your tutor before clicking Submit.')) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/student/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignment._id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitted(true)
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      isGraded ? 'border-green-100'
      : isSubmitted ? 'border-blue-100'
      : assignment.isOverdue ? 'border-red-100'
      : 'border-gray-100 hover:border-gray-200'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isGraded ? 'bg-green-100'
            : isSubmitted ? 'bg-blue-100'
            : 'bg-purple-100'
          }`}>
            {isGraded
              ? <Award size={18} className="text-green-600" />
              : isSubmitted
              ? <CheckCircle size={18} className="text-blue-600" />
              : <ClipboardList size={18} className="text-purple-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 leading-tight">{assignment.title}</h3>
            <p className="text-gray-400 text-xs mt-0.5">by {assignment.tutorName}</p>
          </div>
          {isGraded && assignment.submission?.percentage !== null && (
            <div className={`shrink-0 text-center px-3 py-1.5 rounded-xl border ${
              (assignment.submission?.percentage ?? 0) >= 70
                ? 'bg-green-50 border-green-200 text-green-700'
                : (assignment.submission?.percentage ?? 0) >= 50
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className="font-bold text-lg">{assignment.submission?.percentage}%</p>
              <p className="text-xs">
                {assignment.submission?.score}/{assignment.totalScore}
              </p>
            </div>
          )}
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>
            {assignment.courseName}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Award size={11} />
            {assignment.totalScore} marks
          </span>
          {assignment.dueDate && (
            <span className={`text-xs flex items-center gap-1 ${
              assignment.isOverdue ? 'text-red-500' : 'text-gray-400'
            }`}>
              <Clock size={11} />
              {assignment.isOverdue ? 'Overdue · ' : 'Due '}
              {new Date(assignment.dueDate).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}
          {isSubmitted && !isGraded && (
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
              Awaiting grading
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{assignment.description}</p>

        {/* Graded score bar */}
        {isGraded && assignment.submission?.percentage !== null && (
          <div className="mb-4">
            <ScoreBar percentage={assignment.submission?.percentage ?? 0} />
            {assignment.submission?.feedback && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 mb-1">Tutor Feedback</p>
                <p className="text-sm text-gray-700">{assignment.submission.feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Less' : 'Details'}
          </button>

          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 ml-auto"
            >
              <Send size={13} />
              {submitting ? 'Submitting...' : 'Mark as Submitted'}
            </button>
          )}

          {isSubmitted && !isGraded && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
              <CheckCircle size={13} />
              Submitted {new Date(assignment.submission!.submittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{assignment.description}</p>
          </div>
          {assignment.instructions && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Instructions</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{assignment.instructions}</p>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              ⚠ Submit your work directly to your tutor (via Discord or email), then click "Mark as Submitted" above to notify them.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentAssignments() {
  const [data, setData] = useState<{ assignments: AssignmentData[]; pending: AssignmentData[]; submitted: AssignmentData[]; graded: AssignmentData[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'pending' | 'submitted' | 'graded'>('pending')

  useEffect(() => {
    fetch('/api/dashboard/student/assignments')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load assignments'))
      .finally(() => setLoading(false))
  }, [])

  const items =
    tab === 'pending' ? (data?.pending ?? [])
    : tab === 'submitted' ? (data?.submitted ?? [])
    : (data?.graded ?? [])

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="font-bold text-2xl text-gray-900">Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.pending.length ?? 0} pending · {data?.submitted.length ?? 0} awaiting grading · {data?.graded.length ?? 0} graded
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['pending', 'submitted', 'graded'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="ml-1.5 text-xs opacity-75">
                ({t === 'pending' ? data?.pending.length ?? 0 : t === 'submitted' ? data?.submitted.length ?? 0 : data?.graded.length ?? 0})
              </span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {tab === 'pending' ? 'No pending assignments' : tab === 'submitted' ? 'No assignments awaiting grading' : 'No graded assignments yet'}
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            {items.map(a => (
              <AssignmentCard key={a._id} assignment={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}