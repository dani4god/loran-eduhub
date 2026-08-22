// components/tutor/MyAssignedCourses.tsx
'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'

interface Course { _id: string; name: string; category: string }

export default function MyAssignedCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tutor/profile').then((r) => r.json()).then((d) => setCourses(d.tutor?.courses || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Courses You Teach</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Assigned by our admin team based on your application. Contact support if you'd like to teach an additional course.
      </p>
      <div className="flex flex-wrap gap-2">
        {courses.map((c) => (
          <span key={c._id} className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full">
            {c.name}
          </span>
        ))}
        {courses.length === 0 && <p className="text-sm text-gray-400">No courses assigned yet.</p>}
      </div>
    </div>
  )
}