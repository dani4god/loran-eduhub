// components/self-paced/CourseReviewForm.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StarRating from '@/components/shared/StarRating'
import { SURVEY_OPTIONS } from '@/lib/selfPacedReview'
import { Loader2, CheckCircle2 } from 'lucide-react'

const QUESTIONS: { field: keyof typeof SURVEY_OPTIONS; label: string }[] = [
  { field: 'courseExperience', label: 'How was the course experience?' },
  { field: 'wouldRecommend', label: 'Would you recommend this course to a friend?' },
  { field: 'difficultyLevel', label: 'Were the concepts in this course too difficult to comprehend?' },
  { field: 'weeklyStructureHelpful', label: 'How would you evaluate the week-by-week structure of this course — did it help?' },
  { field: 'hadOneOnOneSession', label: 'Did you have a one-on-one session with the tutor?' },
  { field: 'tutorRating', label: 'How would you rate the tutor overall?' },
  { field: 'workshopRating', label: 'How were the weekly workshops?' },
  { field: 'careerImpact', label: 'Did this course improve your professional standing or job opportunities?' },
]

export default function CourseReviewForm() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [weekTitles, setWeekTitles] = useState<string[]>([])
  const [rating, setRating] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [mostDifficult, setMostDifficult] = useState('')
  const [platformMessage, setPlatformMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/self-paced/courses/${courseId}/content`).then((r) => r.json()).then((d) => {
      setWeekTitles((d.weeks || []).map((w: any) => `Week ${w.weekNumber}: ${w.title}`))
    })
  }, [courseId])

  const submit = async () => {
    if (!rating) { setError('Please give a star rating'); return }
    const requiredFields = QUESTIONS.map((q) => q.field)
    const missing = requiredFields.find((f) => !answers[f])
    if (missing || !mostDifficult) { setError('Please answer every question'); return }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/self-paced/courses/${courseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, ...answers, mostDifficultConcept: mostDifficult, platformMessage }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push(`/dashboard/self-paced/course/${courseId}`), 1500)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Thank you for your review!</p>
            <p className="text-sm text-gray-500 mt-1">Redirecting you to download your certificate...</p>
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
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Course Review</h1>
          <p className="text-sm text-gray-500 mb-6">Your feedback helps future students and is required before downloading your certificate.</p>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Overall Rating</label>
              <StarRating value={rating} onChange={setRating} size={26} />
            </div>

            {QUESTIONS.map((q) => (
              <div key={q.field}>
                <label className="text-sm text-gray-700 mb-1.5 block">{q.label}</label>
                <select
                  value={answers[q.field] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.field]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="">Select an answer...</option>
                  {SURVEY_OPTIONS[q.field].map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}

            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">What was the most difficult concept in the course?</label>
              <select value={mostDifficult} onChange={(e) => setMostDifficult(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                <option value="">Select a week...</option>
                <option value="none">None — it was manageable</option>
                {weekTitles.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">Say something about Loran EduHub (optional)</label>
              <textarea value={platformMessage} onChange={(e) => setPlatformMessage(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button onClick={submit} disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting && <Loader2 size={15} className="animate-spin" />} Submit Review & Unlock Certificate
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}