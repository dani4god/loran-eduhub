'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface Course {
  _id: string
  name: string
  category: string
}

export default function NewMaterialPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tutor/courses')
      .then(r => r.json())
      .then(d => setCourses(d.courses || []))
  }, [])

  const create = async () => {
    if (!courseId || !title.trim()) {
      setError('Please select a course and enter a title')
      return
    }
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/tutor/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, title, description }),
      })
      const data = await res.json()

      if (res.ok) {
        router.push(`/dashboard/tutor/library/${data.material._id}/edit`)
      } else {
        setError(data.error || 'Failed to create material')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">New Course Material</h1>
          <p className="text-sm text-gray-500 mb-5">
            You'll add chapters, topics, and content in the next step.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Course
              </label>
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">Select a course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Title
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Python Programming"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              onClick={create}
              disabled={creating}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}