// components/library/TutorLibraryList.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, Eye, EyeOff, Layers, ChevronRight } from 'lucide-react'

interface Material {
  _id: string
  title: string
  description?: string
  status: 'draft' | 'published'
  course: { _id: string; name: string; category: string } | null
  chapterCount: number
  updatedAt: string
}

export default function TutorLibraryList() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tutor/library')
      .then(r => r.json())
      .then(d => setMaterials(d.materials || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Course Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create and manage course materials for your students.
            </p>
          </div>
          <Link
            href="/dashboard/tutor/library/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            <Plus size={16} /> New Material
          </Link>
        </div>

        {materials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No course materials yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {materials.map(m => (
              <Link
                key={m._id}
                href={`/dashboard/tutor/library/${m._id}/edit`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      m.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {m.status === 'published' ? <Eye size={11} /> : <EyeOff size={11} />}
                    {m.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{m.title}</h3>
                {m.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{m.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Layers size={12} /> {m.chapterCount} chapter{m.chapterCount !== 1 ? 's' : ''}
                  </span>
                  {m.course && <span>{m.course.name}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}