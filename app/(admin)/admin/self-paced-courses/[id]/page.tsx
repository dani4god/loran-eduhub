// app/(admin)/admin/self-paced-courses/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/AdminLayout'
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import SelfPacedContent from '@/components/self-paced/SelfPacedContent'

export default function AdminReviewSelfPacedCourse() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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

  if (loading || !course) return <AdminLayout><div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div></AdminLayout>

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500"><ArrowLeft size={15} /> Back</button>

        {course.coverImageUrl && <img src={course.coverImageUrl} className="w-full h-48 object-cover rounded-2xl" />}

        <div>
          <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{course.description}</p>
          <p className="text-xs text-gray-400 mt-1">Category: {course.category} · {course.price === 0 ? 'Free' : `₦${course.price.toLocaleString('en-NG')}`}</p>
        </div>

        {course.weeks.map((w: any) => (
          <div key={w._id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-2">Week {w.weekNumber}: {w.title}</h2>
            <div className="mb-4"><SelfPacedContent html={w.content} /></div>
            {w.links?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {w.links.map((l: any, i: number) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{l.label}: {l.url}</span>)}
              </div>
            )}
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><HelpCircle size={12} /> Exam ({w.exam.durationMinutes} min)</p>
            <div className="space-y-2">
              {w.exam.questions.map((q: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-800">{i + 1}. {q.question}</p>
                  {q.options?.length > 0 && <p className="text-xs text-gray-500 mt-1">Options: {q.options.join(', ')}</p>}
                  <p className="text-xs text-green-600 font-semibold mt-1">Correct answer: {q.correctAnswer}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {course.status === 'pending_approval' && (
          rejecting ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Rejection reason..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={() => setRejecting(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
                <button onClick={reject} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">Confirm Reject</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 sticky bottom-4">
              <button onClick={approve} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold"><CheckCircle2 size={15} /> Approve & Publish</button>
              <button onClick={() => setRejecting(true)} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold"><XCircle size={15} /> Reject</button>
            </div>
          )
        )}
      </div>
    </AdminLayout>
  )
}