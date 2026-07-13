'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Clock, Award, CheckCircle, AlertCircle,
  ChevronRight, BookOpen, Lock,
} from 'lucide-react'

interface ExamItem {
  _id: string
  title: string
  courseName: string
  courseCategory: string
  tutorName: string
  duration: number
  instructions: string
  scheduledDate: string | null
  questionCount: number
  taken: boolean
  grade: {
    score: number
    total: number
    percentage: number
    gradedAt: string
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

function ScoreDisplay({ percentage }: { percentage: number }) {
  const color =
    percentage >= 70 ? 'text-green-600'
    : percentage >= 50 ? 'text-yellow-600'
    : 'text-red-600'
  const bg =
    percentage >= 70 ? 'bg-green-50 border-green-200'
    : percentage >= 50 ? 'bg-yellow-50 border-yellow-200'
    : 'bg-red-50 border-red-200'
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${bg}`}>
      <span className={`font-bold text-lg ${color}`}>{percentage}%</span>
      <span className="text-xs text-gray-500">
        {percentage >= 70 ? 'Excellent' : percentage >= 50 ? 'Pass' : 'Fail'}
      </span>
    </div>
  )
}

function ExamCard({ exam, taken }: { exam: ExamItem; taken: boolean }) {
  const catColor = CATEGORY_COLORS[exam.courseCategory] ?? 'bg-gray-50 text-gray-700'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      taken ? 'border-gray-100' : 'border-gray-100 hover:border-blue-200 hover:shadow-sm'
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            taken ? 'bg-green-100' : 'bg-purple-100'
          }`}>
            {taken
              ? <CheckCircle size={18} className="text-green-600" />
              : <FileText size={18} className="text-purple-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight">
              {exam.title}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">{exam.courseName}</p>
            <p className="text-gray-400 text-xs">by {exam.tutorName}</p>
          </div>
          {exam.taken && exam.grade && (
            <ScoreDisplay percentage={exam.grade.percentage} />
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>
            {exam.courseCategory.toUpperCase()}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={11} />
            {exam.duration} mins
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <FileText size={11} />
            {exam.questionCount} questions
          </span>
          {exam.taken && exam.grade && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Award size={11} />
              {exam.grade.score}/{exam.grade.total} marks
            </span>
          )}
        </div>

        {/* Instructions preview */}
        {exam.instructions && !taken && (
          <p className="text-xs text-gray-400 mb-4 line-clamp-2">
            {exam.instructions}
          </p>
        )}

        {/* Taken result detail */}
        {taken && exam.grade && (
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Score</span>
              <span className="font-bold text-gray-900">
                {exam.grade.score} / {exam.grade.total}
              </span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  exam.grade.percentage >= 70 ? 'bg-green-500'
                  : exam.grade.percentage >= 50 ? 'bg-yellow-500'
                  : 'bg-red-500'
                }`}
                style={{ width: `${exam.grade.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Submitted{' '}
              {new Date(exam.grade.gradedAt).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Action */}
        {!taken ? (
          <Link
            href={`/dashboard/student/exams/${exam._id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors"
          >
            Start Exam <ChevronRight size={15} />
          </Link>
        ) : (
          <Link
            href={`/dashboard/student/exams/${exam._id}/results`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors"
          >
            View Results <ChevronRight size={15} />
          </Link>
        )}
      </div>
    </div>
  )
}

export default function StudentExams() {
  const [data, setData] = useState<{ upcoming: ExamItem[]; completed: ExamItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming')

  useEffect(() => {
    fetch('/api/dashboard/student/exams')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false))
  }, [])

  const items = tab === 'upcoming' ? (data?.upcoming ?? []) : (data?.completed ?? [])

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-2xl text-gray-900">Exams</h1>
            <p className="text-gray-500 text-sm mt-1">
              {data?.upcoming.length ?? 0} pending · {data?.completed.length ?? 0} completed
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'completed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {t === 'upcoming' ? 'Pending' : 'Completed'}
              <span className="ml-1.5 text-xs opacity-75">
                ({t === 'upcoming' ? data?.upcoming.length ?? 0 : data?.completed.length ?? 0})
              </span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            {tab === 'upcoming'
              ? <><FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500 font-medium">No pending exams</p><p className="text-gray-400 text-sm mt-1">Your tutor hasn't published any exams yet</p></>
              : <><CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500 font-medium">No completed exams yet</p></>
            }
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map(exam => (
              <ExamCard key={exam._id} exam={exam} taken={exam.taken} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}