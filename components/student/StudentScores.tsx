'use client'

import { useState, useEffect } from 'react'
import { Award, FileText, ClipboardList, TrendingUp, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface ScoreItem {
  type: 'exam' | 'assignment'
  title: string
  score: number
  total: number
  percentage: number
  date: string
  feedback: string
}

interface CourseScores {
  courseId: string
  courseName: string
  courseCategory: string
  tutorName: string
  plan: string
  status: string
  scores: ScoreItem[]
  stats: {
    totalExams: number
    totalAssignments: number
    avgScore: number | null
    highestScore: number | null
    lowestScore: number | null
  }
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
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${
        percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
      }`}>{percentage}%</span>
    </div>
  )
}

function CourseScoreCard({ course }: { course: CourseScores }) {
  const [expanded, setExpanded] = useState(false)
  const catColor = CATEGORY_COLORS[course.courseCategory] ?? 'bg-gray-50 text-gray-700'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900">{course.courseName}</h3>
            <p className="text-gray-400 text-xs mt-0.5">with {course.tutorName}</p>
            <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
              {course.courseCategory.toUpperCase()}
            </span>
          </div>
          {course.stats.avgScore !== null && (
            <div className={`text-center px-4 py-2 rounded-xl border ${
              course.stats.avgScore >= 70 ? 'bg-green-50 border-green-200'
              : course.stats.avgScore >= 50 ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
            }`}>
              <p className={`font-bold text-2xl ${
                course.stats.avgScore >= 70 ? 'text-green-700'
                : course.stats.avgScore >= 50 ? 'text-yellow-700'
                : 'text-red-700'
              }`}>
                {course.stats.avgScore}%
              </p>
              <p className="text-gray-400 text-xs">Average</p>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Exams', value: course.stats.totalExams, icon: FileText },
            { label: 'Assignments', value: course.stats.totalAssignments, icon: ClipboardList },
            { label: 'Highest', value: course.stats.highestScore !== null ? `${course.stats.highestScore}%` : '—', icon: TrendingUp },
            { label: 'Lowest', value: course.stats.lowestScore !== null ? `${course.stats.lowestScore}%` : '—', icon: Award },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <s.icon size={14} className="text-gray-400 mx-auto mb-1" />
              <p className="font-bold text-gray-900 text-sm">{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Expand button */}
        {course.scores.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {expanded ? 'Hide' : 'View'} All Scores ({course.scores.length})
          </button>
        )}

        {course.scores.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-3">No scores yet for this course</p>
        )}
      </div>

      {/* Score list */}
      {expanded && course.scores.length > 0 && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">
            All Scores
          </p>
          <div className="space-y-4">
            {course.scores.map((score, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    score.type === 'exam' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {score.type === 'exam'
                      ? <FileText size={12} className="text-blue-600" />
                      : <ClipboardList size={12} className="text-purple-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{score.title}</p>
                    <p className="text-xs text-gray-400">
                      {score.type === 'exam' ? 'Exam' : 'Assignment'} ·{' '}
                      {new Date(score.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{score.score}/{score.total}</p>
                  </div>
                </div>
                <ScoreBar percentage={score.percentage} />
                {score.feedback && (
                  <p className="text-xs text-gray-500 mt-1.5 italic pl-8">"{score.feedback}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentScores() {
  const [data, setData] = useState<{ courses: CourseScores[]; overallAvg: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/student/scores')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load scores'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-bold text-2xl text-gray-900">My Scores</h1>
          <p className="text-gray-500 text-sm mt-1">
            All exam and assignment scores across your courses
          </p>
        </div>

        {/* Overall average banner */}
        {data?.overallAvg !== null && data?.overallAvg !== undefined && (
          <div className={`rounded-2xl p-5 mb-6 text-white ${
            data.overallAvg >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-600'
            : data.overallAvg >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
            : 'bg-gradient-to-r from-red-500 to-rose-600'
          }`}>
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">
              Overall Average
            </p>
            <p className="font-bold text-5xl">{data.overallAvg}%</p>
            <p className="text-white/70 text-sm mt-1">
              Across {data.courses.length} course{data.courses.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {!loading && !error && (data?.courses.length ?? 0) === 0 && (
          <div className="text-center py-16">
            <Award className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No scores yet</p>
            <p className="text-gray-400 text-sm mt-1">Complete exams and assignments to see your scores here</p>
          </div>
        )}

        {!loading && !error && (data?.courses.length ?? 0) > 0 && (
          <div className="space-y-4">
            {data!.courses.map(course => (
              <CourseScoreCard key={course.courseId} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}