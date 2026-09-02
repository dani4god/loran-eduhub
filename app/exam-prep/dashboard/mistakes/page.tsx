//app/exam-prep/dashboard/mistakes/page.tsx
'use client'
import { useEffect, useState } from 'react'

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<any[]>([])
  useEffect(() => { fetch('/api/exam-prep/mistakes').then(r => r.json()).then(d => setMistakes(d.mistakes || [])) }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Mistake Bank</h1>
      <p className="mt-1 text-sm text-slate-500">Review wrong answers and explanations.</p>
      <div className="mt-5 space-y-4">
        {mistakes.map((m, i) => (
          <article key={`${m.attemptId}-${i}`} className="rounded-2xl border bg-white p-5">
            <div className="flex gap-2 text-[10px] font-bold uppercase"><span className="text-blue-600">{m.subject}</span><span className="text-slate-400">{m.topic}</span></div>
            <p className="mt-3 text-sm font-semibold leading-6">{m.question}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-red-50 p-3 text-xs"><b>Your answer:</b> {m.selected || 'Unanswered'}</div>
              <div className="rounded-xl bg-green-50 p-3 text-xs"><b>Correct:</b> {m.correct}</div>
            </div>
            {m.explanation && <p className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-800">{m.explanation}</p>}
          </article>
        ))}
      </div>
    </div>
  )
}
