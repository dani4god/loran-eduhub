'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, ChevronDown, ChevronUp, Clock, FileText,
  Award, User, CheckCircle, Circle, TrendingUp, AlertCircle,
  Calendar, ChevronRight,
} from 'lucide-react'

interface CourseData {
  enrollmentId: string
  courseId: string
  courseName: string
  courseCategory: string
  courseDescription: string
  syllabus: string[]
  tutorName: string
  tutorImage: string | null
  tutorBio: string
  plan: string
  status: string
  startDate: string
  endDate: string
  daysElapsed: number
  totalDays: number
  timeProgress: number
  totalExams: number
  examsTaken: number
  examProgress: number
  avgScore: number | null
  upcomingExams: { _id: string; title: string; duration: number; scheduledDate: string | null }[]
  recentGrades: { _id: string; score: number; total: number; percentage: number; gradedAt: string }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: 'bg-blue-100 text-blue-700 border-blue-200',
  igcse: 'bg-purple-100 text-purple-700 border-purple-200',
  language: 'bg-green-100 text-green-700 border-green-200',
  ielts: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'jamb-waec': 'bg-orange-100 text-orange-700 border-orange-200',
  diploma: 'bg-pink-100 text-pink-700 border-pink-200',
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tech', igcse: 'IGCSE', language: 'Language',
  ielts: 'IELTS', 'jamb-waec': 'JAMB/WAEC', diploma: 'EduTech',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-orange-100 text-orange-700',
  expired: 'bg-red-100 text-red-700',
}

const PLAN_LABELS: Record<string, string> = {
  trial: 'Free Trial', '3months': '3 Months',
  '6months': '6 Months', '1year': '1 Year Diploma',
}

function ProgressBar({ value, color = 'bg-blue-600' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

function ScoreChip({ percentage }: { percentage: number }) {
  const color =
    percentage >= 70 ? 'bg-green-100 text-green-700'
    : percentage >= 50 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {percentage}%
    </span>
  )
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function CourseCard({ course }: { course: CourseData }) {
  const [expanded, setExpanded] = useState(false)
  const catColor = CATEGORY_COLORS[course.courseCategory] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  const statusColor = STATUS_COLORS[course.status] ?? 'bg-gray-100 text-gray-700'
  const daysLeft = course.totalDays - course.daysElapsed

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          {/* Tutor avatar */}
          <div className="shrink-0">
            {course.tutorImage ? (
              <img
                src={course.tutorImage}
                alt={course.tutorName}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                {getInitials(course.tutorName)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {course.courseName}
              </h3>
              <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                {course.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm">with {course.tutorName}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
                {CATEGORY_LABELS[course.courseCategory] ?? course.courseCategory}
              </span>
              <span className="text-xs text-gray-400">
                {PLAN_LABELS[course.plan] ?? course.plan}
              </span>
            </div>
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-3">
          {/* Time progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Time Progress
              </span>
              <span className="font-semibold text-gray-700">
                {course.daysElapsed}/{course.totalDays} days
                {daysLeft > 0 && ` · ${daysLeft}d left`}
              </span>
            </div>
            <ProgressBar
              value={course.timeProgress}
              color={
                course.timeProgress >= 80 ? 'bg-orange-500'
                : course.timeProgress >= 50 ? 'bg-blue-500'
                : 'bg-green-500'
              }
            />
          </div>

          {/* Exam progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1">
                <FileText size={11} />
                Exams Completed
              </span>
              <span className="font-semibold text-gray-700">
                {course.examsTaken}/{course.totalExams}
              </span>
            </div>
            <ProgressBar value={course.examProgress} color="bg-purple-500" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">{course.totalExams}</p>
            <p className="text-gray-400 text-xs">Total Exams</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">{course.examsTaken}</p>
            <p className="text-gray-400 text-xs">Taken</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">
              {course.avgScore !== null ? `${course.avgScore}%` : '—'}
            </p>
            <p className="text-gray-400 text-xs">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border-t border-gray-100"
      >
        <span>Course Details</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100">

          {/* Description */}
          {course.courseDescription && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                About this course
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {course.courseDescription}
              </p>
            </div>
          )}

          {/* Syllabus */}
          {course.syllabus.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Syllabus
              </p>
              <div className="space-y-1.5">
                {course.syllabus.map((topic, idx) => {
                  const done = idx < course.examsTaken
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      {done ? (
                        <CheckCircle size={14} className="text-green-500 shrink-0" />
                      ) : (
                        <Circle size={14} className="text-gray-300 shrink-0" />
                      )}
                      <span className={`text-sm ${done ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                        {topic}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upcoming exams */}
          {course.upcomingExams.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Upcoming Exams
              </p>
              <div className="space-y-2">
                {course.upcomingExams.map(ex => (
                  <Link
                    key={ex._id}
                    href={`/dashboard/exams/${ex._id}`}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={14} className="text-purple-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-purple-900">{ex.title}</p>
                        <p className="text-xs text-purple-600">{ex.duration} mins</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-purple-400 group-hover:text-purple-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent grades */}
          {course.recentGrades.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Recent Scores
              </p>
              <div className="space-y-2">
                {course.recentGrades.map(grade => (
                  <div
                    key={grade._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {grade.score}/{grade.total} marks
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScoreChip percentage={grade.percentage} />
                      <span className="text-xs text-gray-400">
                        {new Date(grade.gradedAt).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-50">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              Started {new Date(course.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              Ends {new Date(course.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentCourses() {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all')

  useEffect(() => {
    fetch('/api/dashboard/student/courses')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setCourses(d.courses)
      })
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    filter === 'all' ? courses : courses.filter(c => c.status === filter)

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-bold text-2xl text-gray-900">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['all', 'active', 'paused', 'expired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {f === 'all' ? 'All Courses' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({courses.filter(c => c.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {filter === 'all' ? 'No courses enrolled yet' : `No ${filter} courses`}
            </p>
            {filter === 'all' && (
              <Link
                href="/auth/student/register"
                className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
              >
                Enroll in a Course
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(course => (
              <CourseCard key={course.enrollmentId} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}