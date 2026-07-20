// components/shared/TutorReviewsPanel.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, MessageSquare, User } from 'lucide-react'
import StarRating from './StarRating'

interface ReviewItem {
  _id: string
  rating: number
  comment: string
  studentDisplayName: string
  courseName: string
  createdAt: string
}

export function RatingSummaryBadge({ average, count }: { average: number; count: number }) {
  if (count === 0) {
    return <span className="text-xs text-gray-400">No reviews yet</span>
  }
  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={Math.round(average)} readOnly size={13} />
      <span className="text-xs font-semibold text-gray-700">{average.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

export default function TutorReviewsPanel({ tutorId }: { tutorId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !expanded
    setExpanded(next)
    if (next && !loaded) {
      setLoading(true)
      try {
        const res = await fetch(`/api/tutors/${tutorId}/reviews`)
        const data = await res.json()
        setReviews(data.reviews || [])
        setLoaded(true)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        type="button"
        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
      >
        <MessageSquare size={12} />
        {expanded ? 'Hide reviews' : 'See reviews'}
        <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-4 text-center">
              <div className="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User size={11} className="text-gray-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 truncate">{r.studentDisplayName}</span>
                  </div>
                  <StarRating value={r.rating} readOnly size={11} />
                </div>
                <p className="text-[11px] text-gray-400 mb-1">{r.courseName}</p>
                {r.comment && <p className="text-xs text-gray-600">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}