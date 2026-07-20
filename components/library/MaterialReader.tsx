// components/library/MaterialReader.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Menu, X, Lock, CheckCircle2, Circle, ChevronRight,
  ExternalLink, HelpCircle, Check, XCircle,
} from 'lucide-react'

interface Question {
  _id: string
  type: 'mcq' | 'fill' | 'trueFalse'
  question: string
  options?: string[]
}

interface Unit {
  key: string
  level: 'chapter' | 'topic' | 'subtopic'
  title: string
  chapterTitle: string
  topicTitle?: string
  locked: boolean
  completed: boolean
  content: string | null
  links: { label: string; url: string }[]
  questions: Question[]
}

interface AnswerFeedback {
  isCorrect: boolean
  correctAnswer: string
  explanation: string | null
}

function QuestionBlock({
  question,
  materialId,
  unitKey,
  onAnswered,
}: {
  question: Question
  materialId: string
  unitKey: string
  onAnswered: (questionId: string) => void
}) {
  const [selected, setSelected] = useState('')
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!selected.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/student/library/${materialId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitKey, questionId: question._id, selectedAnswer: selected }),
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback(data)
        onAnswered(question._id)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <HelpCircle size={15} className="text-purple-500 mt-0.5 shrink-0" />
        <p className="text-sm font-semibold text-gray-800">{question.question}</p>
      </div>

      {question.type === 'mcq' && (
        <div className="space-y-2">
          {question.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => !feedback && setSelected(opt)}
              disabled={!!feedback}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                selected === opt
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600'
              } ${feedback ? 'opacity-70' : 'hover:border-blue-300'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === 'trueFalse' && (
        <div className="flex gap-2">
          {['true', 'false'].map(v => (
            <button
              key={v}
              onClick={() => !feedback && setSelected(v)}
              disabled={!!feedback}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border ${
                selected === v ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {question.type === 'fill' && (
        <input
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={!!feedback}
          placeholder="Type your answer..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      )}

      {!feedback ? (
        <button
          onClick={submit}
          disabled={!selected.trim() || submitting}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
        >
          {submitting ? 'Checking...' : 'Check Answer'}
        </button>
      ) : (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
            feedback.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.isCorrect ? <Check size={15} className="shrink-0 mt-0.5" /> : <XCircle size={15} className="shrink-0 mt-0.5" />}
          <div>
            <p className="font-semibold">{feedback.isCorrect ? 'Correct!' : `Incorrect — correct answer: ${feedback.correctAnswer}`}</p>
            {feedback.explanation && <p className="mt-1 text-gray-600">{feedback.explanation}</p>}
            <button
              onClick={() => { setFeedback(null); setSelected('') }}
              className="mt-2 text-blue-600 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MaterialReader({ materialId }: { materialId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [units, setUnits] = useState<Unit[]>([])
  const [percent, setPercent] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [localAnswered, setLocalAnswered] = useState<Record<string, Set<string>>>({})
  const [localViewed, setLocalViewed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`/api/student/library/${materialId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error)
          return
        }
        setTitle(d.title)
        setUnits(d.units)
        setPercent(d.percent)

        const viewed = new Set<string>()
        const answered: Record<string, Set<string>> = {}
        d.units.forEach((u: Unit) => {
          if (u.completed) {
            viewed.add(u.key)
            answered[u.key] = new Set(u.questions.map(q => q._id))
          }
        })
        setLocalViewed(viewed)
        setLocalAnswered(answered)

        const startIndex = d.lastVisitedKey
          ? d.units.findIndex((u: Unit) => u.key === d.lastVisitedKey)
          : d.unlockedIndex
        setCurrentIndex(Math.max(0, startIndex === -1 ? d.unlockedIndex : startIndex))
      })
      .catch(() => setError('Failed to load material'))
      .finally(() => setLoading(false))
  }, [materialId])

  const currentUnit = units[currentIndex]

  // Mark the current unit as viewed as soon as it's opened.
  useEffect(() => {
    if (!currentUnit || currentUnit.locked) return
    if (localViewed.has(currentUnit.key)) return

    fetch(`/api/student/library/${materialId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitKey: currentUnit.key }),
    }).then(() => {
      setLocalViewed(prev => new Set([...prev, currentUnit.key]))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUnit?.key])

  const canAdvance = useMemo(() => {
    if (!currentUnit) return false
    if (!localViewed.has(currentUnit.key)) return false
    const answeredSet = localAnswered[currentUnit.key] || new Set()
    return currentUnit.questions.every(q => answeredSet.has(q._id))
  }, [currentUnit, localViewed, localAnswered])

  const handleAnswered = (unitKey: string, questionId: string) => {
    setLocalAnswered(prev => {
      const copy = { ...prev }
      copy[unitKey] = new Set([...(copy[unitKey] || []), questionId])
      return copy
    })
  }

  const goNext = () => {
    if (!canAdvance) return
    if (currentIndex < units.length - 1) setCurrentIndex(currentIndex + 1)
  }

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const jumpTo = (index: number) => {
    if (units[index].locked) return
    setCurrentIndex(index)
    setSidebarOpen(false)
  }

  const refreshPercent = () => {
    const completedCount = units.filter(u => {
      if (!localViewed.has(u.key)) return false
      const answeredSet = localAnswered[u.key] || new Set()
      return u.questions.every(q => answeredSet.has(q._id))
    }).length
    return units.length ? Math.round((completedCount / units.length) * 100) : 0
  }

  if (loading) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !currentUnit) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-gray-900 font-semibold">Couldn't load this material</p>
          <p className="text-gray-500 text-sm">{error || 'No content available yet.'}</p>
          <button
            onClick={() => router.push('/dashboard/student/library')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  const livePercent = refreshPercent()

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'fixed inset-0 z-40 bg-black/40' : 'hidden'
        } lg:static lg:block lg:bg-transparent lg:z-auto`}
        onClick={() => setSidebarOpen(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="w-80 max-w-[85vw] h-full bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] overflow-y-auto border-r border-gray-100 p-4"
        >
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <p className="font-bold text-gray-900 text-sm">Contents</p>
            <button onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          </div>

          <div className="space-y-0.5">
            {units.map((u, i) => {
              const isActive = i === currentIndex
              const answeredSet = localAnswered[u.key] || new Set()
              const isComplete = localViewed.has(u.key) && u.questions.every(q => answeredSet.has(q._id))

              return (
                <button
                  key={u.key}
                  onClick={() => jumpTo(i)}
                  disabled={u.locked}
                  className={`w-full flex items-center gap-2 text-left rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  } ${u.locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ paddingLeft: u.level === 'chapter' ? 10 : u.level === 'topic' ? 24 : 38 }}
                >
                  {u.locked ? (
                    <Lock size={12} className="shrink-0 text-gray-300" />
                  ) : isComplete ? (
                    <CheckCircle2 size={13} className="shrink-0 text-green-500" />
                  ) : (
                    <Circle size={12} className="shrink-0 text-gray-300" />
                  )}
                  <span className="truncate">{u.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="sticky top-16 lg:top-0 z-10 bg-white border-b border-gray-100">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
            <button onClick={() => router.push('/dashboard/student/library')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft size={18} />
            </button>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Menu size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{title}</p>
              <p className="text-xs text-gray-400 truncate">
                {currentUnit.chapterTitle}
                {currentUnit.topicTitle ? ` · ${currentUnit.topicTitle}` : ''}
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 shrink-0">{livePercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-100">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${livePercent}%` }} />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentUnit.title}</h1>

          {currentUnit.content ? (
            <div
              className="prose prose-sm sm:prose-base max-w-none prose-a:text-blue-600"
              dangerouslySetInnerHTML={{ __html: currentUnit.content }}
            />
          ) : (
            <p className="text-sm text-gray-400 italic">No written content on this page.</p>
          )}

          {currentUnit.links.length > 0 && (
            <div className="space-y-2">
              {currentUnit.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 mr-2"
                >
                  <ExternalLink size={14} /> Click here: {link.label}
                </a>
              ))}
            </div>
          )}

          {currentUnit.questions.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Revision
              </p>
              {currentUnit.questions.map(q => (
                <QuestionBlock
                  key={q._id}
                  question={q}
                  materialId={materialId}
                  unitKey={currentUnit.key}
                  onAnswered={qId => handleAnswered(currentUnit.key, qId)}
                />
              ))}
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-30"
            >
              Previous
            </button>

            {!canAdvance && (
              <p className="text-xs text-gray-400 hidden sm:block">
                {currentUnit.questions.length > 0
                  ? 'Answer the question(s) above to continue'
                  : 'Loading...'}
              </p>
            )}

            <button
              onClick={goNext}
              disabled={!canAdvance || currentIndex === units.length - 1}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-30"
            >
              {currentIndex === units.length - 1 ? 'Last page' : 'Next'} <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}