'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, X, Award, Clock, ChevronLeft } from 'lucide-react'

export default function ExamResultsPage() {
  const { examId } = useParams<{ examId: string }>()
  const router = useRouter()
  const [grade, setGrade] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/student/exams/${examId}/results`)
      .then(r => r.json())
      .then(d => setGrade(d.grade))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [examId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!grade) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 font-medium">No results found for this exam.</p>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  const passed = grade.percentage >= 50

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={() => router.push('/dashboard/exams')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5 text-sm font-medium"
        >
          <ChevronLeft size={16} /> Back to Exams
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className={`px-6 py-8 text-center ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
            <p className="text-white font-bold text-5xl">{grade.percentage}%</p>
            <p className="text-white/80 text-sm mt-2">{grade.score} / {grade.total} marks</p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${passed ? 'bg-green-400/20 text-white border border-green-300/30' : 'bg-red-400/20 text-white border border-red-300/30'}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>

          <div className="p-6 space-y-4">
            {grade.breakdown?.map((b: any, idx: number) => (
              <div
                key={b.questionId}
                className={`p-4 rounded-xl border ${b.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {b.isCorrect
                    ? <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />
                    : <X size={15} className="text-red-500 shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-medium text-gray-800">
                    Q{idx + 1}. {b.questionText}
                  </p>
                </div>
                <div className="pl-5 space-y-1 text-xs text-gray-500">
                  <p>Your answer: <span className={`font-semibold ${b.isCorrect ? 'text-green-700' : 'text-red-600'}`}>{b.studentAnswer ?? '(not answered)'}</span></p>
                  {!b.isCorrect && <p>Correct: <span className="font-semibold text-green-700">{b.correctAnswer}</span></p>}
                  <p className="text-gray-400">{b.awarded}/{b.marks} marks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}