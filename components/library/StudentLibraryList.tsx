// components/library/StudentLibraryList.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'

interface MaterialItem {
  materialId: string
  title: string
  description?: string
  courseName: string
  tutorName: string
  chapterCount: number
  percent: number
  started: boolean
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent === 100 ? 'bg-green-500' : percent > 0 ? 'bg-blue-500' : 'bg-gray-200'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{percent}%</span>
    </div>
  )
}

export default function StudentLibraryList() {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/library')
      .then(r => r.json())
      .then(d => setMaterials(d.materials || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Course Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Materials your tutors have published for your enrolled courses.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No course materials published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {materials.map(m => (
              <Link
                key={m.materialId}
                href={`/dashboard/student/library/${m.materialId}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {m.courseName}
                  </span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{m.title}</h3>
                <p className="text-xs text-gray-400 mb-4">{m.tutorName} · {m.chapterCount} chapters</p>
                <ProgressBar percent={m.percent} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}