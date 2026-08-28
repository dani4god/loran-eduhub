'use client'
import { useEffect, useState } from 'react'
import { StudyWithTutorAd, JoinDiscordAd } from '@/components/examprep/ExamPrepDiscordCTA'
import { Clock, Loader2 } from 'lucide-react'
import { ALOC_AVAILABLE_YEARS } from '@/lib/alocApi'

const SUBJECTS_BY_TYPE: Record<string, string[]> = {
  jamb: ['mathematics', 'english', 'physics', 'chemistry', 'biology', 'economics', 'government'],
  waec: ['mathematics', 'english', 'physics', 'chemistry', 'biology', 'economics', 'government', 'literature'],
  neco: ['mathematics', 'english', 'physics', 'chemistry', 'biology', 'economics', 'government'],
}
const DURATIONS = [15, 30, 45, 60]

export default function TakeExamPage() {
  const [examType, setExamType] = useState('jamb')
  const [subject, setSubject] = useState('')
  const [year, setYear] = useState('')
  const [duration, setDuration] = useState(30)
  const [loadingQ, setLoadingQ] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const regNumber = typeof window !== 'undefined' ? localStorage.getItem('examPrepRegNumber') : null

  useEffect(() => {
    if (!session || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => { if (s <= 1) { submit(); return 0 } return s - 1 }), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const startExam = async () => {
    if (!subject) return
    setLoadingQ(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/exam-prep/exam/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regNumber, examType, subject, year: year || undefined, durationMinutes: duration }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSession(data); setAnswers({}); setCurrent(0); setSecondsLeft(data.durationMinutes * 60)
    } finally { setLoadingQ(false) }
  }

  const submit = async () => {
    const res = await fetch('/api/exam-prep/exam/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: session.sessionToken, answers, durationSeconds: session.durationMinutes * 60 - secondsLeft }),
    })
    const data = await res.json()
    setResult(data); setSession(null)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center mb-4">
          <p className="text-3xl font-bold text-blue-600 mb-1">{result.percentage}%</p>
          <p className="text-sm text-gray-600">You scored {result.score} out of {result.total}</p>
        </div>
        <button onClick={() => setResult(null)} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold">Take Another Exam</button>
      </div>
    )
  }

  if (session) {
    const q = session.questions[current]
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-2 z-10">
          <p className="text-sm font-semibold text-gray-800">Question {current + 1} of {session.questions.length}</p>
          <span className={`font-mono font-bold ${secondsLeft < 60 ? 'text-red-600' : 'text-gray-800'}`}>
            <Clock size={14} className="inline mr-1" />{fmt(secondsLeft)}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          {q.imageUrl && <img src={q.imageUrl} className="w-full rounded-lg mb-3" />}
          {q.section && (
            // Rendered as HTML — sections/questions from ALOC can contain
            // real markup (MathML equations, formatting) that must be
            // interpreted, not shown as literal tags.
            <div className="text-xs text-gray-600 mb-2 italic" dangerouslySetInnerHTML={{ __html: q.section }} />
          )}
          <div className="text-sm font-semibold text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: q.text }} />
          {Object.entries(q.options || {}).map(([key, val]: any) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-800 mb-2 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
              <input type="radio" name={q.id} checked={answers[q.id] === key} onChange={() => setAnswers({ ...answers, [q.id]: key })} />
              <span className="font-semibold uppercase shrink-0">{key}.</span>
              <span dangerouslySetInnerHTML={{ __html: val }} />
            </label>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold disabled:opacity-30">Previous</button>
          {current < session.questions.length - 1 ? (
            <button onClick={() => setCurrent((c) => c + 1)} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold">Next</button>
          ) : (
            <button onClick={submit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Submit Exam</button>
          )}
        </div>

        <StudyWithTutorAd />
        <JoinDiscordAd />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Take a Practice Exam</h1>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Exam Type</label>
          <select value={examType} onChange={(e) => { setExamType(e.target.value); setSubject('') }} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900">
            <option value="jamb">JAMB</option>
            <option value="waec">WAEC</option>
            <option value="neco">NECO</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900">
            <option value="">Select subject...</option>
            {SUBJECTS_BY_TYPE[examType].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900">
            <option value="">Any year</option>
            {ALOC_AVAILABLE_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Duration</label>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900">
            {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={startExam} disabled={!subject || loadingQ} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          {loadingQ && <Loader2 size={15} className="animate-spin" />} Start Exam
        </button>
      </div>
    </div>
  )
}