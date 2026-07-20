// app/(public)/auth/student/select-tutors/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { RatingSummaryBadge } from '@/components/shared/TutorReviewsPanel'
import TutorReviewsPanel from '@/components/shared/TutorReviewsPanel'

interface TutorPricing {
  monthly: number
  threeMonths: number
  sixMonths: number
  oneYear: number
}

interface Tutor {
  _id: string
  firstName: string
  lastName: string
  bio: string
  profileImage?: string
  pricing: TutorPricing
  rating: { average: number; count: number }
  courses: Array<{ _id: string; name: string }>
}

interface CourseWithTutors {
  courseId: string
  courseName: string
  courseCategory: string
  tutors: Tutor[]
  selectedTutorId?: string
  hasTutors: boolean
}

export default function SelectTutorsPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithTutors[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedCourses')
    if (!stored) {
      router.push('/auth/student/register')
      return
    }

    const selectedCourses = JSON.parse(stored)

    const fetchAllTutors = async () => {
      try {
        const response = await fetch('/api/tutors/all')
        const data = await response.json()

        if (data.success) {
          const coursesWithTutors = selectedCourses.map((selectedCourse: any) => {
            const tutorsForCourse = data.tutors.filter((tutor: Tutor) =>
              tutor.courses.some(course => course._id === selectedCourse.courseId)
            )

            return {
              courseId: selectedCourse.courseId,
              courseName: selectedCourse.courseName,
              courseCategory: selectedCourse.courseCategory,
              tutors: tutorsForCourse,
              selectedTutorId: undefined,
              hasTutors: tutorsForCourse.length > 0,
            }
          })

          setCourses(coursesWithTutors)
        }
      } catch (error) {
        console.error('Error fetching tutors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTutors()
  }, [router])

  const selectTutor = (courseId: string, tutorId: string) => {
    setCourses(prev =>
      prev.map(course =>
        course.courseId === courseId ? { ...course, selectedTutorId: tutorId } : course
      )
    )
  }

  const handleContinue = () => {
    const coursesWithoutTutors = courses.filter(course => !course.hasTutors)
    const coursesWithoutSelection = courses.filter(course => course.hasTutors && !course.selectedTutorId)

    if (coursesWithoutTutors.length > 0) {
      alert(
        `The following courses have no tutors available:\n${coursesWithoutTutors
          .map(c => c.courseName)
          .join('\n')}\n\nPlease remove these courses from your selection.`
      )
      return
    }

    if (coursesWithoutSelection.length > 0) {
      alert(`Please select a tutor for:\n${coursesWithoutSelection.map(c => c.courseName).join('\n')}`)
      return
    }

    const selections = courses.map(course => {
      const tutor = course.tutors.find(t => t._id === course.selectedTutorId)
      return {
        courseId: course.courseId,
        courseName: course.courseName,
        tutorId: course.selectedTutorId,
        tutorName: tutor?.firstName,
        pricing: tutor?.pricing,
      }
    })

    sessionStorage.setItem('courseTutorSelections', JSON.stringify(selections))
    router.push('/auth/student/register-details')
  }

  const removeCourse = (courseId: string) => {
    const updatedCourses = courses.filter(c => c.courseId !== courseId)
    setCourses(updatedCourses)

    const currentSelections = JSON.parse(sessionStorage.getItem('selectedCourses') || '[]')
    const updatedSelections = currentSelections.filter((c: any) => c.courseId !== courseId)
    sessionStorage.setItem('selectedCourses', JSON.stringify(updatedSelections))

    if (updatedCourses.length === 0) {
      router.push('/auth/student/register')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-3">Loading tutors...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Select Your Tutors</h1>
            <p className="text-gray-600 mt-2">Choose a tutor for each selected course</p>
          </div>

          <div className="space-y-6">
            {courses.map(course => (
              <div
                key={course.courseId}
                className={`bg-white rounded-lg shadow-sm p-6 ${!course.hasTutors ? 'border-2 border-red-200 bg-red-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{course.courseName}</h2>
                  <button onClick={() => removeCourse(course.courseId)} className="text-red-500 hover:text-red-700 text-sm">
                    Remove Course
                  </button>
                </div>

                {!course.hasTutors ? (
                  <div className="bg-re/paged-100 border border-red-300 rounded-lg p-4 text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 font-medium">No tutor available for this course yet</p>
                    <p className="text-red-600 text-sm mt-1">Please remove this course to continue</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.tutors.map(tutor => (
                        <div
                          key={tutor._id}
                          onClick={() => selectTutor(course.courseId, tutor._id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                            course.selectedTutorId === tutor._id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {tutor.profileImage ? (
                              <img src={tutor.profileImage} alt={tutor.firstName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                <span className="text-gray-500 font-medium">
                                  {tutor.firstName?.[0]}{tutor.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900">{tutor.firstName} {tutor.lastName}</h3>
                              <RatingSummaryBadge average={tutor.rating.average} count={tutor.rating.count} />
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tutor.bio || 'Experienced tutor'}</p>

                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500 flex flex-wrap gap-3 mb-2">
                                  <span className="font-medium text-gray-700">₦{tutor.pricing?.monthly?.toLocaleString('en-NG') || '0'}/mo</span>
                                  <span className="font-medium text-gray-700">₦{tutor.pricing?.threeMonths?.toLocaleString('en-NG') || '0'}/3mo</span>
                                  <span className="font-medium text-gray-700">₦{tutor.pricing?.sixMonths?.toLocaleString('en-NG') || '0'}/6mo</span>
                                  <span className="font-medium text-gray-700">₦{tutor.pricing?.oneYear?.toLocaleString('en-NG') || '0'}/yr</span>
                                </p>
                                <TutorReviewsPanel tutorId={tutor._id} />
                              </div>
                            </div>
                            {course.selectedTutorId === tutor._id && (
                              <svg className="w-6 h-6 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {course.selectedTutorId && (
                      <div className="mt-3 text-sm text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Tutor selected
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <Link href="/auth/student/register" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              ← Back
            </Link>
            <button onClick={handleContinue} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Continue to Registration →
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}