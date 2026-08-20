// components/self-paced/CoursePublicReviews.tsx
'use client'

import { useEffect, useState } from 'react'
import StarRating from '@/components/shared/StarRating'
import { labelFor } from '@/lib/selfPacedReview'
import { MessageSquare, User } from 'lucide-react'

export default function CoursePublicReviews({ courseId }: { courseId: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/self-paced/courses/${courseId}/reviews`).then((r) => r.json()).then(setData)
  }, [courseId])

  if (!data || data.count === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={18} className="text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">See What Our Students & Graduates Say</h2>
      </div>
      <div className="flex items-center gap-2 mb-5">
        <StarRating value={Math.round(data.average)} readOnly size={16} />
        <span className="text-sm font-semibold text-gray-700">{data.average.toFixed(1)}</span>
        <span className="text-sm text-gray-400">({data.count} review{data.count !== 1 ? 's' : ''})</span>
      </div>

      <div className="space-y-4">
        {data.reviews.map((r: any) => (
          <div key={r._id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">{r.studentDisplayName}</span>
              </div>
              <StarRating value={r.rating} readOnly size={13} />
            </div>

            {r.platformMessage && <p className="text-sm text-gray-600 mb-2 italic">"{r.platformMessage}"</p>}

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
              <p><span className="text-gray-400">Experience:</span> {labelFor('courseExperience', r.courseExperience)}</p>
              <p><span className="text-gray-400">Recommends:</span> {labelFor('wouldRecommend', r.wouldRecommend)}</p>
              <p><span className="text-gray-400">Difficulty:</span> {labelFor('difficultyLevel', r.difficultyLevel)}</p>
              <p><span className="text-gray-400">Structure:</span> {labelFor('weeklyStructureHelpful', r.weeklyStructureHelpful)}</p>
              <p><span className="text-gray-400">Tutor:</span> {labelFor('tutorRating', r.tutorRating)}</p>
              <p><span className="text-gray-400">Career impact:</span> {labelFor('careerImpact', r.careerImpact)}</p>
            </div>
            {r.mostDifficultConcept && r.mostDifficultConcept !== 'none' && (
              <p className="text-xs text-gray-400 mt-1.5">Toughest concept: {r.mostDifficultConcept}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}