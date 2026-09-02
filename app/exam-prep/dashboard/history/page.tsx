'use client'
import { useEffect, useState } from 'react'

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<any[]>([])
  useEffect(() => { fetch('/api/exam-prep/history').then(r => r.json()).then(d => setAttempts(d.attempts || [])) }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Exam History</h1>
      <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
        {attempts.map((a) => (
          <div key={a._id} className="flex items-center justify-between border-b p-4 last:border-b-0">
            <div><p className="font-semibold">{a.subject}</p><p className="text-[10px] uppercase text-slate-400">{a.attemptType} · {a.examType} · {new Date(a.createdAt).toLocaleDateString()}</p></div>
            <div className="text-right"><p className="font-black">{a.percentage}%</p><p className="text-[10px] text-slate-400">{a.score}/{a.total}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}
