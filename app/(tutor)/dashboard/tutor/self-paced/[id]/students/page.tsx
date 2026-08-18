'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Lock, Unlock, User } from 'lucide-react'

export default function SelfPacedStudentsPage() {
  const params = useParams()
  const courseId = params.id as string
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => fetch(`/api/tutor/self-paced-courses/${courseId}/students`).then((r) => r.json()).then((d) => setStudents(d.students || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [courseId])

  const unlock = async (enrollmentId: string) => {
    if (!confirm('Unlock this course for the student? Their failed week attempt will be reset.')) return
    await fetch(`/api/tutor/self-paced-courses/${courseId}/students/${enrollmentId}/unlock`, { method: 'POST' })
    load()
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <Link href={`/dashboard/tutor/self-paced/${courseId}`} className="flex items-center gap-1.5 text-sm text-gray-500"><ArrowLeft size={15} /> Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Enrolled Students</h1>

        {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <div className="space-y-2.5">
            {students.map((s) => (
              <div key={s.enrollmentId} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><User size={16} className="text-blue-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.studentName}</p>
                  <p className="text-xs text-gray-400">Week {s.unlockedWeek} · {s.averageScore}% avg · ₦{s.amountPaid.toLocaleString('en-NG')} paid</p>
                </div>
                {s.locked ? (
                  <button onClick={() => unlock(s.enrollmentId)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
                    <Unlock size={12} /> Unlock
                  </button>
                ) : (
                  <span className="text-xs text-green-600 font-semibold">Active</span>
                )}
              </div>
            ))}
            {students.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No students yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}