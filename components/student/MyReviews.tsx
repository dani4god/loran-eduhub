// components/student/MyReviews.tsx
'use client'

import { useEffect, useState } from 'react'
import { Star, BookOpen, User, Loader2, CheckCircle } from 'lucide-react'
import StarRating from '@/components/shared/StarRating'

interface ReviewableCourse {
  tutorId: string
  tutorName: string
  courseId: string
  courseName: string
  existingReview: { rating: number; comment: string; updatedAt: string } | null
}

export default function MyReviews() {
  const [courses, setCourses] = useState<ReviewableCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/student/reviewable-courses')
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const keyOf = (c: ReviewableCourse) => `${c.tutorId}:${c.courseId}`

  const openForm = (c: ReviewableCourse) => {
    setActiveKey(keyOf(c))
    setRating(c.existingReview?.rating || 0)
    setComment(c.existingReview?.comment || '')
    setSavedKey(null)
  }

  const submit = async (c: ReviewableCourse) => {
    if (!rating) return
    setSaving(true)
    try {
      const res = await fetch('/api/student/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: c.tutorId, courseId: c.courseId, rating, comment }),
      })
      if (res.ok) {
        setSavedKey(keyOf(c))
        setActiveKey(null)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">You haven't enrolled in any courses yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {courses.map((c) => {
        const key = keyOf(c)
        const isOpen = activeKey === key

        return (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <BookOpen size={14} className="text-blue-500 shrink-0" /> {c.courseName}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                  <User size={11} className="shrink-0" /> {c.tutorName}
                </p>
              </div>
              {c.existingReview && !isOpen && <StarRating value={c.existingReview.rating} readOnly size={14} />}
            </div>

            {savedKey === key && (
              <p className="flex items-center gap-1 text-xs font-semibold text-green-600 mb-2">
                <CheckCircle size={13} /> Review saved
              </p>
            )}

            {isOpen ? (
              <div className="space-y-3 pt-2 border-t border-gray-50 mt-2">
                <StarRating value={rating} onChange={setRating} size={22} />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Share your experience with this tutor (optional)..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveKey(null)}
                    className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submit(c)}
                    disabled={!rating || saving}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    {c.existingReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => openForm(c)} className="text-xs font-semibold text-blue-600 hover:underline">
                {c.existingReview ? 'Edit your review' : 'Leave a review'}
              </button>
            )}

            {c.existingReview && !isOpen && c.existingReview.comment && (
              <p className="text-xs text-gray-500 mt-2">{c.existingReview.comment}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}