//app/exam-prep/dashboard/live-exams/create/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MonitorUp, Plus, Trash2 } from 'lucide-react'

export default function CreateArena() {
  const router = useRouter()
  const [catalog, setCatalog] = useState<any[]>([])
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [screenShareMode, setScreenShareMode] = useState('off')
  const [maxParticipants, setMaxParticipants] = useState(50)
  const [selected, setSelected] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch('/api/exam-prep/subjects').then(r => r.json()).then(d => setCatalog(d.categories || []))
  }, [])

  const toggle = (subject: string) => {
    setSelected((current) => current.some((x) => x.subject === subject)
      ? current.filter((x) => x.subject !== subject)
      : current.length >= 6 ? current : [...current, { subject, durationMinutes: 30, questionCount: 50 }])
  }

  const update = (subject: string, patch: any) => {
    setSelected((current) => current.map((x) => x.subject === subject ? { ...x, ...patch } : x))
  }

  const create = async () => {
    if (!name.trim() || !selected.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/exam-prep/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, instructions, visibility, screenShareMode, maxParticipants, subjects: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      for (let i = 0; i < selected.length; i++) {
        setStatus(`Generating ${selected[i].subject} (${i + 1}/${selected.length})...`)
        const prep = await fetch(`/api/exam-prep/arena/${data.roomCode}/prepare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjectIndex: i }),
        })
        const pd = await prep.json()
        if (!prep.ok) throw new Error(pd.error)
      }

      router.push(`/exam-prep/dashboard/live-exams/${data.roomCode}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Create Live Competition</h1>
      <p className="mt-1 text-sm text-slate-500">Questions are generated once and shared identically with all participants.</p>

      <div className="mt-5 space-y-5">
        <section className="rounded-2xl border bg-white p-5">
          <label className="text-xs font-semibold">Room name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
          <label className="mt-4 block text-xs font-semibold">Exam instructions<textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="Rules, allowed materials, screen sharing instructions, etc." className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>

          <div className="mt-4">
            <p className="text-xs font-semibold">Screen sharing</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                ['off','Off','No screen sharing'],
                ['optional','Optional','Students may share'],
                ['required','Required','Takers must start browser screen sharing'],
              ].map(([value,label,desc]) => (
                <button key={value} type="button" onClick={() => setScreenShareMode(value)} className={`rounded-xl border p-3 text-left ${screenShareMode === value ? 'border-purple-500 bg-purple-50' : ''}`}>
                  <MonitorUp size={16} className="text-purple-600" />
                  <p className="mt-2 text-xs font-bold">{label}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{desc}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Browser screen sharing requires participant permission. It is not tamper-proof proctoring.</p>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-bold">Subjects</h2>
          <div className="mt-4 space-y-4">
            {catalog.map((cat) => (
              <div key={cat.value}>
                <p className="mb-2 text-[10px] font-bold uppercase text-slate-400">{cat.label}</p>
                <div className="flex flex-wrap gap-2">{cat.subjects.map((s: string) => <button type="button" key={s} onClick={() => toggle(s)} className={`rounded-lg border px-2.5 py-2 text-xs ${selected.some(x => x.subject === s) ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}>{s}</button>)}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {selected.map((s) => (
              <div key={s.subject} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-center">
                <b className="text-sm">{s.subject}</b>
                <select value={s.durationMinutes} onChange={(e) => update(s.subject, { durationMinutes: Number(e.target.value) })} className="rounded-lg border px-2 py-2 text-xs">{[10,15,20,30,45,60].map(v => <option key={v} value={v}>{v} min</option>)}</select>
                <select value={s.questionCount} onChange={(e) => update(s.subject, { questionCount: Number(e.target.value) })} className="rounded-lg border px-2 py-2 text-xs">{[10,20,30,40,50].map(v => <option key={v} value={v}>{v} questions</option>)}</select>
                <button type="button" onClick={() => toggle(s.subject)}><Trash2 size={15} className="text-red-500" /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
          <label className="text-xs font-semibold">Visibility<select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"><option value="public">Public</option><option value="private">Private</option></select></label>
          <label className="text-xs font-semibold">Max participants<input type="number" min={1} max={500} value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
        </section>

        {status && loading && <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">{status}</p>}
        <button onClick={create} disabled={loading || !name.trim() || !selected.length} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{loading ? 'Preparing Competition...' : 'Create Competition'}</button>
      </div>
    </div>
  )
}
