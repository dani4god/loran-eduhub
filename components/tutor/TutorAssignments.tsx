'use client'

import { useState, useEffect } from 'react'
import {
  Plus, ClipboardList, CheckCircle, Clock, Users,
  Award, ChevronDown, ChevronUp, Eye, EyeOff,
  Trash2, X, AlertCircle, BookOpen,
} from 'lucide-react'

interface Submission {
  _id: string
  studentName: string
  studentId: string
  submittedAt: string
  status: 'submitted' | 'graded'
  score: number | null
  feedback: string
  gradedAt: string | null
}

interface AssignmentData {
  _id: string
  title: string
  description: string
  instructions: string
  totalScore: number
  dueDate: string | null
  isPublished: boolean
  courseName: string
  courseCategory: string
  courseId: string
  totalEnrolled: number
  submissionCount: number
  pendingGrading: number
  submissions: Submission[]
  createdAt: string
}

interface Course {
  _id: string
  name: string
  category: string
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: 'bg-blue-100 text-blue-700',
  igcse: 'bg-purple-100 text-purple-700',
  language: 'bg-green-100 text-green-700',
  ielts: 'bg-yellow-100 text-yellow-700',
  'jamb-waec': 'bg-orange-100 text-orange-700',
  diploma: 'bg-pink-100 text-pink-700',
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

export default function TutorAssignments() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null)
  const [gradingAssignmentId, setGradingAssignmentId] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'all' | 'published' | 'draft'>('all')

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    totalScore: 100,
    dueDate: '',
    courseId: '',
    isPublished: false,
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    loadData()
    loadCourses()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assignments')
      const data = await res.json()
      if (data.error) setError(data.error)
      else setAssignments(data.assignments)
    } catch {
      setError('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/tutors/courses')
      const data = await res.json()
      setCourses(data.courses ?? [])
    } catch {}
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    if (!form.title || !form.description || !form.courseId || !form.totalScore) {
      setCreateError('Title, description, course and total score are required.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowCreate(false)
      setForm({ title: '', description: '', instructions: '', totalScore: 100, dueDate: '', courseId: '', isPublished: false })
      loadData()
    } catch (err: any) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const togglePublish = async (assignment: AssignmentData) => {
    try {
      await fetch(`/api/assignments/${assignment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !assignment.isPublished }),
      })
      loadData()
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment? This cannot be undone.')) return
    try {
      await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
      loadData()
    } catch {}
  }

  const handleGrade = async () => {
    if (!gradingSubmission || !gradingAssignmentId || !gradeInput) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/assignments/${gradingAssignmentId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: gradingSubmission._id,
          score: Number(gradeInput),
          feedback: feedbackInput,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGradingSubmission(null)
      setGradingAssignmentId(null)
      setGradeInput('')
      setFeedbackInput('')
      loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filtered =
    tab === 'all' ? assignments
    : tab === 'published' ? assignments.filter(a => a.isPublished)
    : assignments.filter(a => !a.isPublished)

  const totalPending = assignments.reduce((acc, a) => acc + a.pendingGrading, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">
            {assignments.length} total
            {totalPending > 0 && (
              <span className="ml-2 text-orange-600 font-semibold">
                · {totalPending} pending grading
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['all', 'published', 'draft'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="ml-1.5 text-xs opacity-75">
              ({t === 'all' ? assignments.length : t === 'published' ? assignments.filter(a => a.isPublished).length : assignments.filter(a => !a.isPublished).length})
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
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
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No assignments yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700"
          >
            Create First Assignment
          </button>
        </div>
      )}

      {/* Assignment list */}
      <div className="space-y-4">
        {filtered.map(assignment => {
          const isExpanded = expandedId === assignment._id
          const catColor = CATEGORY_COLORS[assignment.courseCategory] ?? 'bg-gray-100 text-gray-600'

          return (
            <div key={assignment._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${assignment.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {assignment.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                        {assignment.courseName}
                      </span>
                      <span className="text-xs text-gray-400">
                        Total: {assignment.totalScore} marks
                      </span>
                      {assignment.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={10} />
                          Due {new Date(assignment.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePublish(assignment)}
                      className={`p-2 rounded-lg transition-colors ${assignment.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={assignment.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {assignment.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(assignment._id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{assignment.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users size={14} className="text-gray-400" />
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{assignment.submissionCount}</p>
                    <p className="text-gray-400 text-xs">Submitted</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock size={14} className="text-orange-400" />
                    </div>
                    <p className="font-bold text-orange-600 text-lg">{assignment.pendingGrading}</p>
                    <p className="text-gray-400 text-xs">Pending</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle size={14} className="text-green-400" />
                    </div>
                    <p className="font-bold text-green-600 text-lg">
                      {assignment.submissionCount - assignment.pendingGrading}
                    </p>
                    <p className="text-gray-400 text-xs">Graded</p>
                  </div>
                </div>

                {/* Expand button */}
                {assignment.submissionCount > 0 && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : assignment._id)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {isExpanded ? 'Hide' : 'View'} Submissions ({assignment.submissionCount})
                  </button>
                )}
              </div>

              {/* Submissions list */}
              {isExpanded && assignment.submissions.length > 0 && (
                <div className="border-t border-gray-100 px-5 pb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">
                    Submissions
                  </p>
                  <div className="space-y-2">
                    {assignment.submissions.map(sub => (
                      <div
                        key={sub._id}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          sub.status === 'graded'
                            ? 'bg-green-50 border-green-100'
                            : 'bg-orange-50 border-orange-100'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{sub.studentName}</p>
                          <p className="text-xs text-gray-400">
                            Submitted {new Date(sub.submittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {sub.status === 'graded' && sub.score !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {sub.score}/{assignment.totalScore}
                            </span>
                            <ScoreChip
                              percentage={Math.round((sub.score / assignment.totalScore) * 100)}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSubmission(sub)
                              setGradingAssignmentId(assignment._id)
                              setGradeInput('')
                              setFeedbackInput('')
                            }}
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Grade
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create assignment modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">New Assignment</h2>
              <button
                onClick={() => { setShowCreate(false); setCreateError('') }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="e.g. Week 3 Research Assignment"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course *</label>
                <select
                  value={form.courseId}
                  onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                >
                  <option value="">— Select a course —</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[80px] resize-y"
                  placeholder="What is this assignment about?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[70px] resize-y"
                  placeholder="Step by step instructions for students..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Total Score *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.totalScore}
                    onChange={e => setForm(f => ({ ...f, totalScore: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                  className="w-4 h-4 accent-purple-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Publish immediately</p>
                  <p className="text-xs text-gray-400">Students will see this assignment right away</p>
                </div>
              </label>

              {createError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {createError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError('') }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Grade Assignment</h2>
              <button
                onClick={() => { setGradingSubmission(null); setGradingAssignmentId(null) }}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-900">{gradingSubmission.studentName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submitted {new Date(gradingSubmission.submittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Score * (out of {assignments.find(a => a._id === gradingAssignmentId)?.totalScore})
                </label>
                <input
                  type="number"
                  min={0}
                  max={assignments.find(a => a._id === gradingAssignmentId)?.totalScore}
                  value={gradeInput}
                  onChange={e => setGradeInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="Enter score"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Feedback (optional)</label>
                <textarea
                  value={feedbackInput}
                  onChange={e => setFeedbackInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[80px] resize-y"
                  placeholder="Leave feedback for the student..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setGradingSubmission(null); setGradingAssignmentId(null) }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrade}
                  disabled={submitting || !gradeInput}
                  className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Submit Grade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}