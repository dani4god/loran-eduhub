// components/tutor/CourseManagement.tsx
'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Plus, X, Loader2, CheckCircle } from 'lucide-react'

interface Course { _id: string; name: string; category: string }

export default function CourseManagement() {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [myCourseIds, setMyCourseIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/courses/simple').then((r) => r.json()),
      fetch('/api/tutor/profile').then((r) => r.json()),
    ])
      .then(([coursesData, profileData]) => {
        setAllCourses(coursesData.courses || [])
        setMyCourseIds((profileData.tutor?.courses || []).map((c: any) => c._id || c))
      })
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSuccess(false)
    setMyCourseIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/tutor/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: myCourseIds }),
      })
      const data = await res.json()
      if (res.ok) setSuccess(true)
      else setError(data.error || 'Failed to save')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const filtered = allCourses.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Courses You Teach</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Add or remove courses. You must teach at least one course.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search courses..."
        className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm mb-3"
      />

      <div className="max-h-72 overflow-y-auto space-y-1.5 mb-4 pr-1">
        {filtered.map((course) => {
          const selected = myCourseIds.includes(course._id)
          return (
            <button
              key={course._id}
              onClick={() => toggle(course._id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{course.name}</span>
              {selected ? (
                <X size={15} className="text-blue-500 shrink-0" />
              ) : (
                <Plus size={15} className="text-gray-400 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mb-3">{myCourseIds.length} course{myCourseIds.length !== 1 ? 's' : ''} selected</p>

      {error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>}
      {success && (
        <p className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
          <CheckCircle size={13} /> Saved
        </p>
      )}

      <button
        onClick={save}
        disabled={saving || myCourseIds.length === 0}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        Save Courses
      </button>
    </div>
  )
}