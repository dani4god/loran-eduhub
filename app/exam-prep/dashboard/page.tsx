//app/exam-prep/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BrainCircuit, ClipboardList, Target, Trophy } from 'lucide-react'
import { useExamPrepStudent } from '@/hooks/useExamPrepStudent'

export default function Dashboard() {
  const { student } = useExamPrepStudent()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/exam-prep/analytics', { cache: 'no-store' }).then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white sm:p-8">
        <p className="text-sm text-blue-200">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{student?.fullName || 'Student'}</h1>
        <p className="mt-2 text-sm text-slate-400">Practice smarter, compete fairly, improve continuously.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Readiness', `${stats?.readiness ?? 0}%`],
          ['Average', `${stats?.overallAverage ?? 0}%`],
          ['Accuracy', `${stats?.accuracy ?? 0}%`],
          ['Attempts', `${stats?.totalAttempts ?? 0}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-4">
            <p className="text-xl font-black">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['/exam-prep/dashboard/take', 'Practice Exam', 'ALOC + AI fallback', ClipboardList],
          ['/exam-prep/dashboard/analytics', 'AI Coach', 'Weaknesses & study plan', BrainCircuit],
          ['/exam-prep/dashboard/live-exams', 'Exam Arena', 'Live competitions', Trophy],
          ['/exam-prep/dashboard/mistakes', 'Mistake Bank', 'Review wrong answers', Target],
        ].map(([href, title, desc, Icon]: any) => (
          <Link key={href} href={href} className="rounded-2xl border bg-white p-5 hover:border-blue-300">
            <Icon size={20} className="text-blue-600" />
            <p className="mt-3 font-bold">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
