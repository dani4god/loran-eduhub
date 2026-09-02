'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Loader2 } from 'lucide-react'

export default function TakePage() {
  const [catalog, setCatalog] = useState<any[]>([])
  const [studentClass, setStudentClass] = useState('ss3')
  const [category, setCategory] = useState('core')
  const [subject, setSubject] = useState('')
  const [examType, setExamType] = useState('jamb')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [year, setYear] = useState('')
  const [session, setSession] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submitted = useRef(false)
  const sessionRef = useRef<any>(null)
  const answersRef = useRef<Record<string, string>>({})
  const secondsRef = useRef(0)

  useEffect(() => {
    fetch('/api/exam-prep/subjects').then(r => r.json()).then(d => setCatalog(d.categories || []))

    const injected = sessionStorage.getItem('examPrepInjectedSession')
    if (injected) {
      try {
        const parsed = JSON.parse(injected)
        sessionStorage.removeItem('examPrepInjectedSession')
        setSession(parsed)
        sessionRef.current = parsed
        setSeconds(parsed.durationMinutes * 60)
        secondsRef.current = parsed.durationMinutes * 60
      } catch {}
    }
  }, [])

  const categorySubjects = useMemo(
    () => catalog.find((c) => c.value === category)?.subjects || [],
    [catalog, category]
  )

  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { secondsRef.current = seconds }, [seconds])

  const submit = async () => {
    const activeSession = sessionRef.current
    if (!activeSession || submitted.current) return
    submitted.current = true

    const res = await fetch('/api/exam-prep/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: activeSession.sessionToken,
        answers: answersRef.current,
        durationSeconds: activeSession.durationMinutes * 60 - secondsRef.current,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      submitted.current = false
      setError(data.error)
      return
    }

    setResult(data)
    setSession(null)
    sessionRef.current = null
  }

  useEffect(() => {
    if (!session || result) return
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setTimeout(submit, 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [session, result])

  const start = async () => {
    setLoading(true)
    setError('')
    submitted.current = false
    try {
      const res = await fetch('/api/exam-prep/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType, subject, studentClass, durationMinutes, year: year || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSession(data)
      sessionRef.current = data
      setSeconds(data.durationMinutes * 60)
      secondsRef.current = data.durationMinutes * 60
      setAnswers({})
      setCurrent(0)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-3xl bg-white p-7 text-center shadow-sm">
          <p className="text-5xl font-black text-blue-600">{result.percentage}%</p>
          <p className="mt-2 text-sm text-slate-500">{result.score}/{result.total} correct</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => setResult(null)} className="rounded-xl border py-3 text-sm font-semibold">Take Another</button>
            <a href="/exam-prep/dashboard/analytics" className="rounded-xl bg-slate-950 py-3 text-sm font-bold text-white">AI Analysis</a>
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    const q = session.questions[current]
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div><p className="text-sm font-bold">Question {current + 1}/{session.questions.length}</p><p className="text-[10px] text-blue-600">{q.topic}</p></div>
          <p className="font-mono font-bold"><Clock size={14} className="mr-1 inline" />{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          {q.section && <div className="mb-3 text-xs text-slate-600" dangerouslySetInnerHTML={{ __html: q.section }} />}
          {q.imageUrl && <img src={q.imageUrl} alt="" className="mb-4 max-h-72 rounded-xl object-contain" />}
          <div className="font-semibold leading-7" dangerouslySetInnerHTML={{ __html: q.text }} />

          <div className="mt-5 space-y-2">
            {Object.entries(q.options || {}).map(([key, value]) => (
              <button key={key} onClick={() => setAnswers({ ...answers, [q.id]: key })} className={`w-full rounded-xl border p-3 text-left text-sm ${answers[q.id] === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <b className="mr-2 uppercase">{key}.</b>{String(value)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-10">
          {session.questions.map((item: any, index: number) => (
            <button key={item.id} onClick={() => setCurrent(index)} className={`rounded-lg py-2 text-[10px] font-bold ${index === current ? 'bg-slate-950 text-white' : answers[item.id] ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{index+1}</button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button disabled={current === 0} onClick={() => setCurrent(current - 1)} className="flex-1 rounded-xl border py-3 text-sm font-semibold disabled:opacity-30">Previous</button>
          {current < session.questions.length - 1
            ? <button onClick={() => setCurrent(current + 1)} className="flex-1 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white">Next</button>
            : <button onClick={submit} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">Submit</button>}
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold">Practice Exam</h1>
      <p className="mt-1 text-sm text-slate-500">Subjects come directly from your SS category catalog.</p>

      <div className="mt-5 space-y-4 rounded-2xl border bg-white p-5">
        <Select label="Class" value={studentClass} setValue={setStudentClass} options={[["ss1","SS 1"],["ss2","SS 2"],["ss3","SS 3"]]} />
        <Select label="Category" value={category} setValue={(v:string) => { setCategory(v); setSubject('') }} options={catalog.map(c => [c.value,c.label])} />
        <Select label="Subject" value={subject} setValue={setSubject} options={[["","Select subject"], ...categorySubjects.map((s: string) => [s,s])]} />
        <Select label="Standard" value={examType} setValue={setExamType} options={[["jamb","JAMB"],["waec","WAEC"],["neco","NECO"],["igcse","IGCSE"],["mixed","Mixed"]]} />
        {['jamb','waec','neco'].includes(examType) && (
          <label className="block text-xs font-semibold text-slate-600">Year (optional)
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2024" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
        )}
        <Select label="Duration" value={String(durationMinutes)} setValue={(v:string) => setDurationMinutes(Number(v))} options={[["15","15 minutes"],["30","30 minutes"],["45","45 minutes"],["60","60 minutes"]]} />

        {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>}
        <button disabled={!subject || loading} onClick={start} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50">{loading && <Loader2 size={15} className="animate-spin" />} Start Exam</button>
      </div>
    </div>
  )
}

function Select({ label, value, setValue, options }: any) {
  return (
    <label className="block text-xs font-semibold text-slate-600">{label}
      <select value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">
        {options.map(([v,l]: any) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}
