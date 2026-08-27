'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingDown, Sparkles, Target } from 'lucide-react'

interface SubjectAvg { subject: string; average: number }

export default function ExamAnalyticsPage() {
  const [data, setData] = useState<{
    totalAttempts: number
    overallAverage: number
    subjectAverages: SubjectAvg[]
    weakestSubjects: SubjectAvg[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const regNumber = localStorage.getItem('examPrepRegNumber')
    fetch(`/api/exam-prep/analytics?regNumber=${regNumber}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
  }

  if (!data || data.totalAttempts === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-blue-600" /> Analytics</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Target className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Take a few practice exams to see your analytics here.</p>
        </div>
      </div>
    )
  }

  const maxAvg = Math.max(...data.subjectAverages.map((s) => s.average), 1)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" /> Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your performance across every subject you've practiced.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.totalAttempts}</p>
          <p className="text-xs text-gray-400 mt-0.5">Exams Taken</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{data.overallAverage}%</p>
          <p className="text-xs text-gray-400 mt-0.5">Overall Average</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-4">Average Score by Subject</p>
        <div className="space-y-3">
          {data.subjectAverages.map((s) => (
            <div key={s.subject}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 capitalize">{s.subject}</span>
                <span className="text-xs font-bold text-gray-600">{s.average}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.average >= 70 ? 'bg-green-500' : s.average >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${(s.average / maxAvg) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.weakestSubjects.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-orange-700 mb-3"><TrendingDown size={15} /> Subjects to Focus On</p>
          <div className="space-y-2">
            {data.weakestSubjects.map((s) => (
              <div key={s.subject} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-gray-700 capitalize">{s.subject}</span>
                <span className="text-xs font-bold text-orange-600">{s.average}% avg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
        <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-1">Coming Soon: AI Weakness Detection</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            We're building an AI feature that analyzes your exam history in detail and suggests
            specific topics to study based on your patterns of mistakes — not just your subject
            averages.
          </p>
        </div>
      </div>
    </div>
  )
}