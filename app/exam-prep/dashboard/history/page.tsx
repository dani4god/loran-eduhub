'use client'

import { useEffect, useState } from 'react'
import { History, FileQuestion } from 'lucide-react'

interface Attempt {
  _id: string
  examType: string
  subject: string
  score: number
  total: number
  percentage: number
  createdAt: string
}

const EXAM_TYPE_LABELS: Record<string, string> = { jamb: 'JAMB', waec: 'WAEC', neco: 'NECO' }

function scoreColor(pct: number) {
  if (pct >= 70) return 'text-green-600 bg-green-50'
  if (pct >= 50) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export default function ExamHistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const regNumber = localStorage.getItem('examPrepRegNumber')
    fetch(`/api/exam-prep/history?regNumber=${regNumber}`)
      .then((r) => r.json())
      .then((d) => setAttempts(d.attempts || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? attempts : attempts.filter((a) => a.examType === filter)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><History size={18} className="text-blue-600" /> Exam History</h1>
        <p className="text-sm text-gray-500 mt-0.5">Every practice exam you've taken, with your score.</p>
      </div>

      <div className="flex gap-1.5">
        {['all', 'jamb', 'waec', 'neco'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            {f === 'all' ? 'All' : EXAM_TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FileQuestion className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No exam attempts yet — take your first practice exam!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {filtered.map((a) => (
            <div key={a._id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 capitalize">{a.subject}</p>
                <p className="text-xs text-gray-400">
                  {EXAM_TYPE_LABELS[a.examType]} · {new Date(a.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-block text-sm font-bold px-2.5 py-1 rounded-lg ${scoreColor(a.percentage)}`}>{a.percentage}%</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{a.score}/{a.total}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}