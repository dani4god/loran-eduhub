// components/self-paced/CourseViewer.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Lock, CheckCircle2, Clock, ExternalLink, Download, MessageSquare, Calendar,
  AlertTriangle, Loader2,
} from 'lucide-react'
import SelfPacedContent from '@/components/self-paced/SelfPacedContent'

export default function CourseViewer({ courseId }: { courseId: string }) {
  const [data, setData] = useState<any>(null)
  const [activeWeek, setActiveWeek] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // exam state
  const [inExam, setInExam] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const load = useCallback(() => {
    fetch(`/api/self-paced/courses/${courseId}/content`).then((r) => r.json()).then((d) => {
      setData(d)
      if (activeWeek === null) setActiveWeek(d.unlockedWeek)
    }).finally(() => setLoading(false))
  }, [courseId, activeWeek])

  useEffect(() => { load() }, [courseId])

  useEffect(() => {
    if (!inExam || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => {
      if (s <= 1) { submitExam(); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inExam])

  const week = data?.weeks?.find((w: any) => w.weekNumber === activeWeek)

  const startExam = () => {
    setAnswers({})
    setResult(null)
    setSecondsLeft(week.durationMinutes * 60)
    setInExam(true)
  }

  const submitExam = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/self-paced/courses/${courseId}/weeks/${activeWeek}/submit-exam`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }),
      })
      const d = await res.json()
      setResult(d)
      setInExam(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const downloadCert = () => window.open(`/api/self-paced/courses/${courseId}/certificate`, '_blank')

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  if (loading || !data) return <><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div><Footer /></>

  const isLocked = data.locked

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-5 py-6">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 space-y-1">
            <h2 className="font-bold text-gray-900 text-sm mb-2">{data.title}</h2>
            {data.weeks.map((w: any) => (
              <button
                key={w.weekNumber}
                onClick={() => { if (!w.locked) { setActiveWeek(w.weekNumber); setInExam(false); setResult(null) } }}
                disabled={w.locked}
                className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-sm ${activeWeek === w.weekNumber ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'} ${w.locked ? 'opacity-40' : ''}`}
              >
                {w.locked ? <Lock size={13} /> : w.passed ? <CheckCircle2 size={13} className="text-green-500" /> : <Clock size={13} className="text-gray-300" />}
                <span className="truncate">Week {w.weekNumber}: {w.title}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Completion Banner */}
            {!isLocked && data.isComplete && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <p className="font-bold text-green-800 text-sm">🎉 Course Complete!</p>
                  <p className="text-xs text-green-600">You've passed every week. Your certificate is ready.</p>
                </div>
                <button onClick={downloadCert} className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 shrink-0">
                  <Download size={15} /> Download Certificate
                </button>
              </div>
            )}

            {isLocked ? (
              <div className="bg-white rounded-2xl border-2 border-red-100 p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Course Locked</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                  You've used all 3 attempts on this week's exam without reaching 70%. Book a coaching session with your tutor to have this course unlocked.
                </p>
                {data.coachingEnabled && (
                  <a href={`/dashboard/self-paced/course/${courseId}/book`} className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Book a Session</a>
                )}
              </div>
            ) : week ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
                {!inExam && !result && (
                  <>
                    <h1 className="text-xl font-bold text-gray-900 mb-4">{week.title}</h1>
                    <div className="mb-6"><SelfPacedContent html={week.content} /></div>
                    {week.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {week.links.map((l: any, i: number) => (
                          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold"><ExternalLink size={13} /> {l.label}</a>
                        ))}
                      </div>
                    )}

                    {/* Coaching prompt */}
                    {data.coachingEnabled && !inExam && !result && (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5 mb-4 flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-xs text-purple-700">Finding this concept difficult? Book a one-on-one session with <strong>{data.tutorName}</strong>.</p>
                        <Link href={`/dashboard/self-paced/course/${courseId}/book`} className="shrink-0 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition">
                          Book Session
                        </Link>
                      </div>
                    )}

                    {week.passed ? (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <p className="text-sm text-green-700 font-semibold">Passed with {week.lastScore}%</p>
                      </div>
                    ) : (
                      <button onClick={startExam} className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                        Start Week {week.weekNumber} Exam ({week.durationMinutes} min, {week.questionCount} questions)
                      </button>
                    )}
                  </>
                )}

                {inExam && (
                  <div>
                    <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-3 border-b border-gray-100">
                      <h2 className="font-bold text-gray-900">{week.title} — Exam</h2>
                      <span className={`font-mono font-bold text-lg ${secondsLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>{fmt(secondsLeft)}</span>
                    </div>
                    <div className="space-y-5">
                      {week.questions.map((q: any, i: number) => (
                        <div key={q._id} className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm font-semibold text-gray-800 mb-3">{i + 1}. {q.question}</p>
                          {q.type === 'mcq' && q.options.map((opt: string, oi: number) => (
                            <label key={oi} className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
                              <input type="radio" name={q._id} checked={answers[q._id] === opt} onChange={() => setAnswers({ ...answers, [q._id]: opt })} /> {opt}
                            </label>
                          ))}
                          {q.type === 'trueFalse' && ['true', 'false'].map((v) => (
                            <label key={v} className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 capitalize">
                              <input type="radio" name={q._id} checked={answers[q._id] === v} onChange={() => setAnswers({ ...answers, [q._id]: v })} /> {v}
                            </label>
                          ))}
                          {q.type === 'fill' && (
                            <input value={answers[q._id] || ''} onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={submitExam} disabled={submitting} className="mt-5 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
                      {submitting && <Loader2 size={14} className="animate-spin" />} Submit Exam
                    </button>
                  </div>
                )}

                {result && !inExam && (
                  <div className={`rounded-xl p-5 text-center ${result.passed ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
                    <p className="text-2xl font-bold mb-1">{result.percentage}%</p>
                    <p className={`text-sm font-semibold mb-2 ${result.passed ? 'text-green-700' : 'text-orange-700'}`}>{result.passed ? 'Passed!' : `Needs ${result.passMark}% to pass`}</p>
                    {!result.passed && (
                      <p className="text-xs text-gray-500">{result.attemptsRemaining > 0 ? `${result.attemptsRemaining} attempt(s) remaining` : 'No attempts remaining — course locked. Book coaching to unlock.'}</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {data.isComplete !== undefined && !isLocked && (
              <div className="mt-5 flex flex-wrap gap-3">
                {data.discordEnabled && (
                  <div className="bg-indigo-50 rounded-xl p-4 flex-1 min-w-[200px]">
                    <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1 mb-1"><MessageSquare size={12} /> Community</p>
                    <p className="text-xs text-indigo-600 mb-2">{data.discordDescription}</p>
                    <Link href="/dashboard/self-paced/discord" className="text-xs font-bold text-indigo-700 underline hover:text-indigo-800 transition">
                      Connect your Discord account →
                    </Link>
                  </div>
                )}
                {data.weeklyWorkshop?.enabled && (
                  <div className="bg-purple-50 rounded-xl p-4 flex-1 min-w-[200px]">
                    <p className="text-xs font-semibold text-purple-700 flex items-center gap-1 mb-1"><Calendar size={12} /> Free Weekly Workshop</p>
                    <p className="text-xs text-purple-600">{data.weeklyWorkshop.dayOfWeek} {data.weeklyWorkshop.time} — {data.weeklyWorkshop.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}