'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Clock, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, Send, X, Award,
} from 'lucide-react'

interface Question {
  _id: string
  type: 'mcq' | 'fill-in-the-gap' | 'true-or-false'
  questionText: string
  options: string[]
  marks: number
  imageUrl: string | null
}

interface ExamInfo {
  _id: string
  title: string
  instructions: string
  duration: number
  courseName: string
  tutorName: string
  questionCount: number
}

interface Result {
  score: number
  total: number
  percentage: number
  passed: boolean
  timeTaken: number
  breakdown: {
    questionId: string
    questionText: string
    type: string
    studentAnswer: string | null
    correctAnswer: string
    isCorrect: boolean
    marks: number
    awarded: number
  }[]
}

export default function TakeExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const router = useRouter()

  // ── State ──
  const [phase, setPhase] = useState<'loading' | 'instructions' | 'exam' | 'submitting' | 'result' | 'error'>('loading')
  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showResultBreakdown, setShowResultBreakdown] = useState(false)

  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const submittedRef = useRef(false)

  // ── Load exam ──
  useEffect(() => {
    fetch(`/api/dashboard/student/exams/${examId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setErrorMsg(d.error)
          setPhase('error')
        } else {
          setExam(d.exam)
          setQuestions(d.questions)
          setSecondsLeft(d.exam.duration * 60)
          setPhase('instructions')
        }
      })
      .catch(() => {
        setErrorMsg('Failed to load exam')
        setPhase('error')
      })
  }, [examId])

  // ── Submit handler ──
  const submitExam = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return
      submittedRef.current = true
      clearInterval(timerRef.current!)
      setPhase('submitting')
      setShowConfirm(false)

      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)

      try {
        const res = await fetch(`/api/dashboard/student/exams/${examId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, timeTaken }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Submission failed')
        setResult(data.result)
        setPhase('result')
      } catch (err: any) {
        setErrorMsg(err.message)
        setPhase('error')
      }
    },
    [answers, examId]
  )

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          submitExam(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, submitExam])

  const startExam = () => {
    startTimeRef.current = Date.now()
    setPhase('exam')
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const answeredCount = Object.keys(answers).length
  const timerUrgent = secondsLeft < 120

  // ── Phases ──

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="font-bold text-gray-900 text-xl mb-2">Cannot Load Exam</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700"
          >
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'instructions' && exam) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 max-w-lg w-full">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="font-bold text-gray-900 text-2xl mb-1">{exam.title}</h1>
          <p className="text-gray-500 text-sm mb-5">
            {exam.courseName} · by {exam.tutorName}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Duration', value: `${exam.duration} mins` },
              { label: 'Questions', value: exam.questionCount },
              { label: 'Start', value: 'Now' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="font-bold text-gray-900 text-lg">{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {exam.instructions && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                Instructions
              </p>
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">
                {exam.instructions}
              </p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              The timer starts as soon as you click "Start Exam". Do not refresh the page or you may lose your answers.
            </p>
          </div>

          <button
            onClick={startExam}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Start Exam <ChevronRight size={18} />
          </button>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="w-full py-2.5 text-gray-500 text-sm mt-2 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if ((phase === 'exam' || phase === 'submitting') && exam && questions.length > 0) {
    const q = questions[current]

    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 flex flex-col">

        {/* Top bar */}
        <div className={`sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between ${
          timerUrgent ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          <div className="text-white">
            <p className="font-bold text-sm leading-tight">{exam.title}</p>
            <p className="text-blue-200 text-xs">{answeredCount}/{questions.length} answered</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
            <Clock size={15} className="text-white" />
            <span className={`font-mono font-bold text-lg text-white ${timerUrgent ? 'animate-pulse' : ''}`}>
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>

        <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 gap-4">

          {/* Question navigator — desktop sidebar */}
          <div className="hidden lg:flex flex-col w-48 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Questions
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, idx) => {
                  const answered = !!answers[questions[idx]._id]
                  const isCurrent = idx === current
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrent(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : answered
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded bg-green-100" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded bg-gray-100" />
                  <span>Unanswered ({questions.length - answeredCount})</span>
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={phase === 'submitting'}
                className="mt-4 w-full py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
              >
                {phase === 'submitting' ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>

          {/* Question area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-4">
              {/* Question header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Question {current + 1} of {questions.length}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                </span>
              </div>

              {/* Question text */}
              <p className="text-gray-900 font-medium text-base sm:text-lg leading-relaxed mb-5">
                {q.questionText}
              </p>

              {/* Image */}
              {q.imageUrl && (
                <img
                  src={q.imageUrl}
                  alt="Question"
                  className="rounded-xl max-h-48 object-contain mb-5 border border-gray-100"
                />
              )}

              {/* MCQ options */}
              {q.type === 'mcq' && (
                <div className="space-y-2.5">
                  {q.options.map((option, idx) => {
                    const selected = answers[q._id] === option
                    return (
                      <button
                        key={idx}
                        onClick={() => setAnswers(a => ({ ...a, [q._id]: option }))}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-medium ${selected ? 'text-blue-900' : 'text-gray-700'}`}>
                          {String.fromCharCode(65 + idx)}. {option}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* True/False */}
              {q.type === 'true-or-false' && (
                <div className="flex gap-3">
                  {['True', 'False'].map(val => {
                    const selected = answers[q._id] === val.toLowerCase()
                    return (
                      <button
                        key={val}
                        onClick={() => setAnswers(a => ({ ...a, [q._id]: val.toLowerCase() }))}
                        className={`flex-1 py-4 rounded-2xl border-2 font-bold text-lg transition-all ${
                          selected
                            ? val === 'True'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Fill in the gap */}
              {q.type === 'fill-in-the-gap' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Your Answer
                  </label>
                  <input
                    type="text"
                    value={answers[q._id] ?? ''}
                    onChange={e =>
                      setAnswers(a => ({ ...a, [q._id]: e.target.value }))
                    }
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {/* Mobile question navigator */}
              <div className="flex lg:hidden gap-1 overflow-x-auto max-w-[160px]">
                {questions.slice(Math.max(0, current - 2), current + 3).map((_, relIdx) => {
                  const absIdx = Math.max(0, current - 2) + relIdx
                  const answered = !!answers[questions[absIdx]._id]
                  const isCurrent = absIdx === current
                  return (
                    <button
                      key={absIdx}
                      onClick={() => setCurrent(absIdx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : answered
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {absIdx + 1}
                    </button>
                  )
                })}
              </div>

              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent(c => c + 1)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={phase === 'submitting'}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition disabled:opacity-50"
                >
                  Submit <Send size={15} />
                </button>
              )}
            </div>

            {/* Mobile submit bar */}
            <div className="lg:hidden mt-4 flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <span className="text-sm text-gray-500">
                {answeredCount}/{questions.length} answered
              </span>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={phase === 'submitting'}
                className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Confirm submit modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="font-bold text-gray-900 text-lg mb-2">Submit Exam?</h3>
              <p className="text-gray-500 text-sm mb-1">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
              </p>
              {answeredCount < questions.length && (
                <p className="text-amber-600 text-sm mb-4 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? 's' : ''} unanswered.
                </p>
              )}
              <p className="text-gray-400 text-xs mb-5">
                You cannot change your answers after submission.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50"
                >
                  Continue
                </button>
                <button
                  onClick={() => submitExam(false)}
                  className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700"
                >
                  Submit Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submitting overlay */}
        {phase === 'submitting' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-700 font-semibold">Submitting your exam...</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'result' && result) {
    const passed = result.percentage >= 50
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">

          {/* Result card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
            <div className={`px-6 py-8 text-center ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {passed
                  ? <CheckCircle className="w-9 h-9 text-white" />
                  : <X className="w-9 h-9 text-white" />
                }
              </div>
              <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">
                {passed ? 'Congratulations!' : 'Better Luck Next Time'}
              </p>
              <p className="text-white font-bold text-5xl">{result.percentage}%</p>
              <p className="text-white/80 text-sm mt-2">
                {result.score} / {result.total} marks
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Score', value: `${result.score}/${result.total}` },
                  { label: 'Time Taken', value: `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` },
                  { label: 'Result', value: passed ? 'PASS' : 'FAIL' },
                ].map(s => (
                  <div key={s.label} className={`text-center p-3 rounded-xl ${s.label === 'Result' ? passed ? 'bg-green-50' : 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className={`font-bold text-sm ${s.label === 'Result' ? passed ? 'text-green-700' : 'text-red-700' : 'text-gray-900'}`}>
                      {s.value}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowResultBreakdown(b => !b)}
                className="w-full py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 mb-3"
              >
                {showResultBreakdown ? 'Hide' : 'View'} Question Breakdown
              </button>

              {showResultBreakdown && (
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {result.breakdown.map((b, idx) => (
                    <div
                      key={b.questionId}
                      className={`p-3 rounded-xl border ${b.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {b.isCorrect
                          ? <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                          : <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                        }
                        <p className="text-xs font-medium text-gray-700">
                          Q{idx + 1}. {b.questionText}
                        </p>
                      </div>
                      <div className="pl-5 space-y-1">
                        <p className="text-xs text-gray-500">
                          Your answer:{' '}
                          <span className={`font-semibold ${b.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {b.studentAnswer ?? '(not answered)'}
                          </span>
                        </p>
                        {!b.isCorrect && (
                          <p className="text-xs text-gray-500">
                            Correct answer:{' '}
                            <span className="font-semibold text-green-700">{b.correctAnswer}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {b.awarded}/{b.marks} marks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => router.push('/dashboard/exams')}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}