'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Search, BookOpen, ArrowRight } from 'lucide-react'

interface Course {
  _id: string
  name: string
  description: string
  category: string
  syllabus: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tech', igcse: 'IGCSE', language: 'Language', ielts: 'IELTS',
  'jamb-waec': 'JAMB/WAEC', diploma: 'EduTech',
}

export default function PublicCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    fetch('/api/courses/simple')
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []))
      .finally(() => setLoading(false))
  }, [])

  const categories = Array.from(new Set(courses.map((c) => c.category)))

  const filtered = courses.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || c.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Courses</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Tech, languages, and exam prep — taught by tutors who set their own pricing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No courses found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((course) => (
                <div key={course._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-blue-600" />
                    </div>
                    <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[course.category] || course.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">{course.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                  {course.syllabus?.length > 0 && (
                    <ul className="text-[11px] text-gray-400 space-y-1 mb-4">
                      {course.syllabus.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/tutors"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Find a tutor for this course <ArrowRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}