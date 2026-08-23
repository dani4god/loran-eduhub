// components/admin/AdminSelfPacedCourseReview.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import SelfPacedContent from '@/components/self-paced/SelfPacedContent'
import { ArrowLeft, CheckCircle2, XCircle, Lock, ChevronLeft, ChevronRight, HelpCircle, Clock } from 'lucide-react'

export default function AdminSelfPacedCourseReview() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeWeek, setActiveWeek] = useState(0)
  const [activePage, setActivePage] = useState(0)
  const [showExam, setShowExam] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetch(`/api/admin/self-paced-courses/${id}`).then((r) => r.json()).then((d) => setCourse(d.course)).finally(() => setLoading(false))
  }, [id])

  const approve = async () => {
    const res = await fetch(`/api/admin/self-paced-courses/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }),
    })
    if (res.ok) { toast.success('Approved and published'); router.push('/admin/self-paced-courses') }
    else toast.error('Failed to approve')
  }

  const reject = async () => {
    if (!reason.trim()) { toast.error('Enter a rejection reason'); return }
    const res = await fetch(`/api/admin/self-paced-courses/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
    })
    if (res.ok) { toast.success('Rejected'); router.push('/admin/self-paced-courses') }
    else toast.error('Failed to reject')
  }

  if (loading || !course) return <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>

  const week = course.weeks[activeWeek]
  const page = week?.pages?.[activePage]
  const isLastPage = week ? activePage === week.pages.length - 1 : false

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5">
      {/* Week/page navigator sidebar */}
      <div className="lg:w-64 shrink-0 space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 mb-3"><ArrowLeft size={15} /> Back</button>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{course.title}</p>
        {course.weeks.map((w: any, wi: number) => (
          <div key={w._id}>
            <button
              onClick={() => { setActiveWeek(wi); setActivePage(0); setShowExam(false) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${activeWeek === wi ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Week {w.weekNumber}: {w.title}
            </button>
          </div>
        ))}
      </div>

      {/* Main content — unlocked, admin can jump freely */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
          {!showExam && page ? (
            <>
              <p className="text-xs font-semibold text-blue-600 mb-1">Page {activePage + 1} of {week.pages.length}</p>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{page.title}</h2>
              <SelfPacedContent html={page.content} />
              {page.links?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {page.links.map((l: any, i: number) => (
                    <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">{l.label}: {l.url}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <button onClick={() => setActivePage((p) => Math.max(0, p - 1))} disabled={activePage === 0} className="flex items-center gap-1 px-3 py-2 text-gray-600 disabled:opacity-30 text-sm font-semibold"><ChevronLeft size={15} /> Previous</button>
                {!isLastPage ? (
                  <button onClick={() => setActivePage((p) => p + 1)} className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold">Next Page <ChevronRight size={15} /></button>
                ) : (
                  <button onClick={() => setShowExam(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"><HelpCircle size={15} /> View Exam ({week.exam.questions.length} questions)</button>
                )}
              </div>
            </>
          ) : showExam ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Week {week.weekNumber} Exam</h2>
                <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /> {week.exam.durationMinutes} min</span>
              </div>
              <div className="space-y-3">
                {week.exam.questions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">{i + 1}. {q.question}</p>
                    {q.options?.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {q.options.map((opt: string, oi: number) => (
                          <p key={oi} className={`text-xs px-2.5 py-1.5 rounded-lg ${opt === q.correctAnswer ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-500'}`}>
                            {opt === q.correctAnswer && <CheckCircle2 size={11} className="inline mr-1 -mt-0.5" />}
                            {opt}
                          </p>
                        ))}
                      </div>
                    )}
                    {(!q.options || q.options.length === 0) && (
                      <p className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1">
                        <CheckCircle2 size={11} /> Correct answer: {q.correctAnswer}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowExam(false)} className="flex items-center gap-1 mt-4 text-sm text-gray-500"><ChevronLeft size={15} /> Back to content</button>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">This week has no pages.</p>
          )}
        </div>

        {course.status === 'pending_approval' && (
          rejecting ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 mt-4">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Rejection reason..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={() => setRejecting(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
                <button onClick={reject} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">Confirm Reject</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 mt-4 sticky bottom-4">
              <button onClick={approve} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold"><CheckCircle2 size={15} /> Approve & Publish</button>
              <button onClick={() => setRejecting(true)} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold"><XCircle size={15} /> Reject</button>
            </div>
          )
        )}
      </div>
    </div>
  )
}