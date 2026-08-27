'use client'
import { useEffect, useState } from 'react'
import { Radio, Clock, Lock } from 'lucide-react'

export default function LiveExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [taking, setTaking] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState<any>(null)

  const regNumber = typeof window !== 'undefined' ? localStorage.getItem('examPrepRegNumber') : null

  const load = () => fetch(`/api/exam-prep/live-exams?regNumber=${regNumber}`).then((r) => r.json()).then((d) => setExams(d.exams || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!taking || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => { if (s <= 1) { submit(); return 0 } return s - 1 }), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taking])

  const start = async (exam: any) => {
    const res = await fetch(`/api/exam-prep/live-exams/${exam._id}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regNumber }) })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    setTaking({ ...data, id: exam._id }); setAnswers({}); setSecondsLeft(data.secondsRemaining)
  }

  const submit = async () => {
    const res = await fetch(`/api/exam-prep/live-exams/${taking.id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regNumber, answers }) })
    const data = await res.json()
    setResult(data); setTaking(null); load()
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  if (result) return <div className="max-w-md mx-auto px-4 py-8 text-center"><div className="bg-white rounded-2xl border border-gray-100 p-6"><p className="text-3xl font-bold text-blue-600">{result.percentage}%</p><p className="text-sm text-gray-500 mt-1">{result.score}/{result.total}</p><button onClick={() => setResult(null)} className="mt-4 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold">Back to Live Exams</button></div></div>

  if (taking) return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4"><h1 className="font-bold text-gray-900">{taking.title}</h1><span className="font-mono font-bold text-red-600">{fmt(secondsLeft)}</span></div>
      <div className="space-y-4">
        {taking.questions.map((q: any, i: number) => (
          <div key={q._id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">{i + 1}. {q.question}</p>
            {q.type === 'mcq' && q.options.map((opt: string, oi: number) => <label key={oi} className="flex items-center gap-2 text-sm mb-1.5"><input type="radio" name={q._id} checked={answers[q._id] === opt} onChange={() => setAnswers({ ...answers, [q._id]: opt })} /> {opt}</label>)}
            {q.type === 'trueFalse' && ['true', 'false'].map((v) => <label key={v} className="flex items-center gap-2 text-sm mb-1.5 capitalize"><input type="radio" name={q._id} checked={answers[q._id] === v} onChange={() => setAnswers({ ...answers, [q._id]: v })} /> {v}</label>)}
            {q.type === 'fill' && <input value={answers[q._id] || ''} onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />}
          </div>
        ))}
      </div>
      <button onClick={submit} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold">Submit Exam</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Radio size={18} className="text-red-500" /> Live Exams</h1>
      {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center"><Radio className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-gray-400 text-sm">No live exams scheduled — exam coming shortly. Check back soon!</p></div>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => (
            <div key={e._id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900 text-sm">{e.title}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.status === 'live' ? 'bg-green-100 text-green-700' : e.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{e.status}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{e.description}</p>
              <p className="flex items-center gap-1 text-xs text-gray-400 mb-3"><Clock size={11} /> {new Date(e.scheduledDate).toLocaleString('en-NG')} · {e.durationMinutes} min</p>
              {e.requirements && <p className="text-xs text-gray-400 mb-3 italic">{e.requirements}</p>}
              {e.status === 'live' && !e.alreadyAttempted && <button onClick={() => start(e)} className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold">Take Exam Now</button>}
              {e.alreadyAttempted && <p className="flex items-center gap-1 text-xs text-green-600 font-semibold"><Lock size={11} /> Already submitted</p>}
              {e.status === 'upcoming' && <p className="text-xs text-gray-400">Starts {new Date(e.scheduledDate).toLocaleString('en-NG')}</p>}
              {e.status === 'closed' && !e.alreadyAttempted && <p className="text-xs text-red-500">This exam has closed</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}