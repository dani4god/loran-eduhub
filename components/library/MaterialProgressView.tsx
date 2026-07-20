// components/library/MaterialProgressView.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'

interface StudentProgress {
  studentId: string
  studentName: string
  percent: number
  lastActivityAt: string | null
  started: boolean
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent === 100 ? 'bg-green-500' : percent > 0 ? 'bg-blue-500' : 'bg-gray-200'
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-9 text-right">{percent}%</span>
    </div>
  )
}

export default function MaterialProgressView({ materialId }: { materialId: string }) {
  const router = useRouter()
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tutor/library/${materialId}/progress`)
      .then(r => r.json())
      .then(d => setStudents(d.students || []))
      .finally(() => setLoading(false))
  }, [materialId])

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Student Progress</h1>
        <p className="text-sm text-gray-500 mb-6">
          See how each enrolled student is progressing through this material.
        </p>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No enrolled students yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {students.map(s => (
              <div key={s.studentId} className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.studentName}</p>
                  <p className="text-xs text-gray-400">
                    {s.started
                      ? s.lastActivityAt
                        ? `Last active ${new Date(s.lastActivityAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
                        : 'Started'
                      : 'Not started yet'}
                  </p>
                </div>
                <div className="w-32 shrink-0">
                  <ProgressBar percent={s.percent} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}