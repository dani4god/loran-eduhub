'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Loader2, RefreshCw } from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async (refresh = false) => {
    setLoading(true)
    const res = await fetch(`/api/exam-prep/analytics${refresh ? '?refresh=1' : ''}`, { cache: 'no-store' })
    setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const practice = async (item: any) => {
    const res = await fetch('/api/exam-prep/exam/weakness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: item.subject, topic: item.topic, count: 15, durationMinutes: 20, studentClass: 'ss3' }),
    })
    const d = await res.json()
    if (!res.ok) return alert(d.error)
    sessionStorage.setItem('examPrepInjectedSession', JSON.stringify(d))
    router.push('/exam-prep/dashboard/take?adaptive=1')
  }

  if (loading) return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin text-blue-600" /></div>
  if (!data?.totalAttempts) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><BrainCircuit className="mx-auto h-12 w-12 text-slate-300" /><h1 className="mt-4 text-xl font-bold">Complete an exam first</h1></div>

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-blue-300">AI Performance Coach</p><h1 className="mt-1 text-2xl font-bold">Your Learning Intelligence</h1></div>
          <button onClick={() => load(true)} className="rounded-xl bg-white/10 p-2"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Readiness', `${data.readiness}%`], ['Average', `${data.overallAverage}%`], ['Accuracy', `${data.accuracy}%`], ['Trend', `${data.trend > 0 ? '+' : ''}${data.trend}%`],
        ].map(([l,v]) => <div key={l} className="rounded-2xl border bg-white p-4"><p className="text-xl font-black">{v}</p><p className="text-xs text-slate-500">{l}</p></div>)}
      </div>

      {data.aiCoach && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-5">
          <h2 className="font-bold text-indigo-900">AI Coach</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{data.aiCoach.summary}</p>
          <div className="mt-4 space-y-2">{(data.aiCoach.recommendations || []).map((x: string, i: number) => <p key={i} className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">{x}</p>)}</div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Weakest Topics</h2>
        <div className="mt-4 space-y-3">
          {data.weakestTopics.map((item: any) => (
            <div key={`${item.subject}:${item.topic}`} className="flex items-center justify-between rounded-xl border p-4">
              <div><p className="text-[10px] font-bold uppercase text-red-500">{item.subject}</p><p className="font-semibold">{item.topic}</p></div>
              <div className="flex items-center gap-3"><b className="text-red-600">{item.percentage}%</b><button onClick={() => practice(item)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Practice</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Subject Performance</h2><div className="mt-4 space-y-3">{data.subjectAverages.map((x:any)=><div key={x.subject}><div className="flex justify-between text-xs"><span>{x.subject}</span><b>{x.average}%</b></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${x.average}%`}}/></div></div>)}</div></section>
        <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Strongest Topics</h2><div className="mt-4 space-y-2">{data.strongestTopics.map((x:any)=><div key={`${x.subject}:${x.topic}`} className="flex justify-between rounded-xl bg-green-50 p-3 text-xs"><span><b>{x.topic}</b><span className="ml-2 text-green-700">{x.subject}</span></span><b>{x.percentage}%</b></div>)}</div></section>
      </div>
    </div>
  )
}
