// app/dashboard/self-paced/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Layers,
  Circle,
  Award,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react'

interface TodoItem {
  label: string
}

interface DashboardCourse {
  enrollmentId: string
  courseId: string
  title: string
  coverImageUrl?: string | null
  completedWeeks: number
  totalWeeks: number
  classification?: string | null
  todos?: TodoItem[]
  isComplete?: boolean
}

interface DashboardData {
  student?: {
    firstName?: string
  }

  courses?: DashboardCourse[]
}

export default function SelfPacedDashboard() {
  const [data, setData] =
    useState<DashboardData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(
          '/api/self-paced/dashboard',
          {
            cache: 'no-store',
          }
        )

        const result =
          await res.json()

        if (!res.ok) {
          throw new Error(
            result?.error ||
              'Failed to load your dashboard'
          )
        }

        if (!cancelled) {
          setData(result)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to load your dashboard'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />

          <p className="text-sm text-gray-500 mt-3">
            Loading your courses...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-7 text-center max-w-sm w-full">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />

          <h2 className="font-bold text-gray-900 mb-1">
            Could not load dashboard
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const courses =
    data?.courses || []

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back
              {data?.student?.firstName
                ? `, ${data.student.firstName}`
                : ''}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Continue learning at your own pace.
            </p>
          </div>

          {courses.length > 0 && (
            <Link
              href="/dashboard/self-paced/purchase"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              <Plus size={15} />
              Add Course
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">

            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />

            <h2 className="font-semibold text-gray-800 mb-1">
              No courses yet
            </h2>

            <p className="text-gray-400 text-sm mb-4">
              You haven't added any self-paced courses to your account.
            </p>

            <Link
              href="/self-paced"
              className="inline-flex px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Browse Courses
            </Link>

          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {courses.map((course) => {
              const totalWeeks =
                Math.max(
                  Number(
                    course.totalWeeks || 0
                  ),
                  0
                )

              const completedWeeks =
                Math.max(
                  Number(
                    course.completedWeeks || 0
                  ),
                  0
                )

              const progress =
                totalWeeks > 0
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        (completedWeeks /
                          totalWeeks) *
                          100
                      )
                    )
                  : 0

              const todos =
                Array.isArray(
                  course.todos
                )
                  ? course.todos
                  : []

              return (
                <Link
                  key={
                    course.enrollmentId
                  }
                  href={`/dashboard/self-paced/course/${course.courseId}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-100 transition-all"
                >

                  <div className="h-36 bg-gray-100">
                    {course.coverImageUrl ? (
                      <img
                        src={
                          course.coverImageUrl
                        }
                        alt={
                          course.title
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">

                    <h3 className="font-bold text-gray-900 text-sm mb-3">
                      {course.title}
                    </h3>

                    <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                      <span>
                        Course progress
                      </span>

                      <span>
                        {Math.round(
                          progress
                        )}
                        %
                      </span>
                    </div>

                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mb-3">
                      {completedWeeks}/
                      {totalWeeks}{' '}
                      weeks

                      {course.classification && (
                        <span className="font-semibold capitalize text-blue-600">
                          {' '}
                          ·{' '}
                          {
                            course.classification
                          }
                        </span>
                      )}
                    </p>

                    {todos.length > 0 && (
                      <div className="space-y-1.5 border-t border-gray-50 pt-3">

                        {todos
                          .slice(0, 3)
                          .map(
                            (
                              todo,
                              index
                            ) => (
                              <p
                                key={
                                  index
                                }
                                className="flex items-start gap-1.5 text-xs text-gray-600"
                              >
                                <Circle
                                  size={
                                    10
                                  }
                                  className="text-orange-400 shrink-0 mt-0.5"
                                />

                                {
                                  todo.label
                                }
                              </p>
                            )
                          )}

                      </div>
                    )}

                    {course.isComplete && (
                      <p className="flex items-center gap-1.5 text-xs text-green-600 font-semibold border-t border-gray-50 pt-3">
                        <Award
                          size={13}
                        />
                        Course completed
                      </p>
                    )}

                  </div>

                </Link>
              )
            })}

          </div>
        )}
      </div>
    </div>
  )
}