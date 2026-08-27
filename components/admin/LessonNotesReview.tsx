// components/admin/LessonNotesReview.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FileText, CheckCircle2, XCircle, Clock, DollarSign, User } from 'lucide-react'

interface LessonNote {
  _id: string
  title: string
  description: string
  coverImageUrl: string | null
  price: number
  subject: string
  studentClass: string
  status: 'pending_approval' | 'published' | 'rejected' | 'draft'
  rejectionReason: string | null
  tutorName: string
  tutorEmail: string
  purchaseCount: number
  updatedAt: string
}

export default function LessonNotesReview() {
  const [status, setStatus] = useState('pending_approval')
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/lesson-notes?status=${status}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [status])

  const approve = async (id: string) => {
    const res = await fetch(`/api/admin/lesson-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    if (res.ok) {
      toast.success('Lesson note approved and published')
      load()
    } else {
      toast.error('Failed to approve')
    }
  }

  const reject = async (id: string) => {
    if (!reason.trim()) {
      toast.error('Enter a rejection reason')
      return
    }
    const res = await fetch(`/api/admin/lesson-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
    })
    if (res.ok) {
      toast.success('Lesson note rejected')
      setRejectingId(null)
      setReason('')
      load()
    } else {
      toast.error('Failed to reject')
    }
  }

  const unpublish = async (id: string, title: string) => {
    if (!confirm(`Unpublish "${title}"? It will no longer be visible to students.`)) return
    const res = await fetch(`/api/admin/lesson-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unpublish' }),
    })
    if (res.ok) {
      toast.success('Lesson note unpublished')
      load()
    } else {
      toast.error('Failed to unpublish')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lesson Notes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Review tutor-submitted lesson notes before they go live.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { v: 'pending_approval', l: 'Pending Review' },
          { v: 'published', l: 'Published' },
          { v: 'rejected', l: 'Rejected' },
          { v: 'all', l: 'All' },
        ].map((s) => (
          <button
            key={s.v}
            onClick={() => setStatus(s.v)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
              status === s.v ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {s.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No lesson notes in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.map((n) => (
            <div key={n._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-28 bg-gray-100">
                {n.coverImageUrl ? (
                  <img src={n.coverImageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
                <p className="text-xs text-gray-400 mb-2">{n.tutorName} · {n.tutorEmail}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{n.description || 'No description provided.'}</p>

                <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <User size={11} /> {n.subject || 'General'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {n.studentClass || 'All'}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={11} /> {n.price === 0 ? 'Free' : `₦${n.price.toLocaleString('en-NG')}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={11} /> {n.purchaseCount || 0} sold
                  </span>
                </div>

                <Link href={`/admin/lesson-notes/${n._id}`} className="text-xs font-semibold text-blue-600 block mb-2 hover:underline">
                  Review Full Content →
                </Link>

                {n.status === 'rejected' && n.rejectionReason && (
                  <p className="text-[11px] text-red-600 bg-red-50 rounded-lg p-2 mb-3">Rejected: {n.rejectionReason}</p>
                )}

                {n.status === 'pending_approval' && (
                  rejectingId === n._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectingId(null)}
                          className="flex-1 py-1.5 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => reject(n._id)}
                          className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(n._id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(n._id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )
                )}

                {n.status === 'published' && (
                  <button
                    onClick={() => unpublish(n._id, n.title)}
                    className="w-full flex items-center justify-center gap-1 py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-semibold hover:bg-orange-100 transition"
                  >
                    Unpublish Lesson Note
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}