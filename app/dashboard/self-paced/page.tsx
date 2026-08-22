'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Layers, CheckCircle2, Circle, Award } from 'lucide-react'

export default function SelfPacedDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/self-paced/dashboard').then((r) => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="pt-16 lg:pt-0 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Welcome back, {data?.student?.firstName}</h1>

        {data?.courses?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-3">You haven't purchased any courses yet.</p>
            <Link href="/self-paced" className="text-blue-600 text-sm font-semibold hover:underline">Browse Courses →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {data?.courses.map((c: any) => (
              <Link key={c.enrollmentId} href={`/dashboard/self-paced/course/${c.courseId}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
                <div className="h-32 bg-gray-100">
                  {c.coverImageUrl ? <img src={c.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-8 h-8 text-gray-300" /></div>}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{c.title}</h3>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-blue-500" style={{ width: `${(c.completedWeeks / c.totalWeeks) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    {c.completedWeeks}/{c.totalWeeks} weeks
                    {c.classification && <span className="font-semibold capitalize text-blue-600"> · {c.classification}</span>}
                  </p>

                  {c.todos.length > 0 && (
                    <div className="space-y-1">
                      {c.todos.map((t: any, i: number) => (
                        <p key={i} className="flex items-center gap-1.5 text-xs text-gray-600"><Circle size={10} className="text-orange-400 shrink-0" /> {t.label}</p>
                      ))}
                    </div>
                  )}
                  {c.isComplete && (
                    <p className="flex items-center gap-1.5 text-xs text-green-600 font-semibold"><Award size={12} /> Certificate ready to download</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}