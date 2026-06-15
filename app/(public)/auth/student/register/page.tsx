// app/(public)/auth/student/register/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface Course {
  _id: string
  name: string
  category: string
  description: string
}

interface Selection {
  courseId: string
  courseName: string
  courseCategory: string
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: '💻 Tech Courses',
  igcse: '🎓 IGCSE Preparation',
  language: '🌍 Language Courses',
  ielts: '📝 IELTS & English',
  'jamb-waec': '📚 JAMB & WAEC',
  diploma: '🏫 Diploma in Education',
}

export default function StudentRegisterPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<Selection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Load courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses/simple')
        const data = await response.json()
        
        console.log('Courses loaded:', data)
        
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses)
        } else {
          console.error('Failed to load courses:', data.error)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [])

  // Toggle course selection
  const toggleCourse = (course: Course) => {
    const exists = selectedCourses.some(c => c.courseId === course._id)
    if (exists) {
      setSelectedCourses(prev => prev.filter(c => c.courseId !== course._id))
    } else {
      setSelectedCourses(prev => [...prev, {
        courseId: course._id,
        courseName: course.name,
        courseCategory: course.category
      }])
    }
  }

  const isSelected = (courseId: string) => {
    return selectedCourses.some(c => c.courseId === courseId)
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchQuery || 
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Get unique categories for filter
  const categories = ['all', ...new Set(courses.map(c => c.category))]

  // Proceed to next step with selected courses
  const handleContinue = () => {
    if (selectedCourses.length === 0) {
      alert('Please select at least one course')
      return
    }
    // Store selected courses in sessionStorage and go to tutor selection
    sessionStorage.setItem('selectedCourses', JSON.stringify(selectedCourses))
    router.push('/auth/student/select-tutors')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Select Your Courses</h1>
            <p className="text-gray-600 mt-2">Choose the courses you want to study</p>
          </div>

          {/* Selected Courses Summary */}
          {selectedCourses.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCourses.map(course => (
                  <span key={course.courseId} className="bg-white text-green-700 px-3 py-1 rounded-full text-sm">
                    {course.courseName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : CATEGORY_LABELS[cat] || cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Courses Grid */}
          {loadingCourses ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-3">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map(course => (
                <div
                  key={course._id}
                  onClick={() => toggleCourse(course)}
                  className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all ${
                    isSelected(course._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                      <span className="inline-block mt-2 text-xs text-gray-500">
                        {CATEGORY_LABELS[course.category] || course.category}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected(course._id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {isSelected(course._id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={selectedCourses.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Select Tutors →
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}