// components/admin/AdminLessonNoteDetail.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import SelfPacedContent from '@/components/self-paced/SelfPacedContent'
import { ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, FileText, User, DollarSign, Clock } from 'lucide-react'

export default function AdminLessonNoteDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [note, setNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState(0)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetch(`/api/admin/lesson-notes/${id}`)
      .then((r) => r.json())
      .then((d) => setNote(d.note))
      .finally(() => setLoading(false))
  }, [id])

  const approve = async () => {
    const res = await fetch(`/api/admin/lesson-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    if (res.ok) {
      toast.success('Lesson note approved and published')
      router.push('/admin/lesson-notes')
    } else {
      toast.error('Failed to approve')
    }
  }

  const reject = async () => {
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
      router.push('/admin/lesson-notes')
    } else {
      toast.error('Failed to reject')
    }
  }

  if (loading || !note) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  // Split content into pages if needed, or use single page
  const pages = note.pages || [{ title: note.title || 'Lesson Note', content: note.content || 'No content provided.' }]
  const page = pages[activePage]

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5">
      {/* Sidebar with note info and page navigation */}
      <div className="lg:w-64 shrink-0 space-y-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            {note.coverImageUrl ? (
              <img src={note.coverImageUrl} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{note.title}</p>
              <p className="text-[10px] text-gray-400">By {note.tutorName}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            <p className="text-[10px] text-gray-400 flex items-center justify-between">
              <span>Status</span>
              <span className={`font-semibold capitalize ${
                note.status === 'published' ? 'text-green-600' :
                note.status === 'pending_approval' ? 'text-yellow-600' :
                note.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {note.status.replace('_', ' ')}
              </span>
            </p>
            <p className="text-[10px] text-gray-400 flex items-center justify-between">
              <span>Price</span>
              <span className="font-semibold text-gray-800">
                {note.price === 0 ? 'Free' : `₦${note.price.toLocaleString('en-NG')}`}
              </span>
            </p>
            <p className="text-[10px] text-gray-400 flex items-center justify-between">
              <span>Purchases</span>
              <span className="font-semibold text-gray-800">{note.purchaseCount || 0}</span>
            </p>
            <p className="text-[10px] text-gray-400 flex items-center justify-between">
              <span>Subject</span>
              <span className="font-semibold text-gray-800">{note.subject || 'General'}</span>
            </p>
            <p className="text-[10px] text-gray-400 flex items-center justify-between">
              <span>Class</span>
              <span className="font-semibold text-gray-800">{note.studentClass || 'All'}</span>
            </p>
          </div>
        </div>

        {/* Page navigation */}
        {pages.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Pages</p>
            <div className="space-y-1">
              {pages.map((p: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActivePage(i)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activePage === i
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Page {i + 1}: {p.title || `Page ${i + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content — unlocked, admin can review freely */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
          {page ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-blue-600">
                    Page {activePage + 1} of {pages.length}
                  </p>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{page.title}</h2>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <SelfPacedContent html={page.content} />
              </div>

              {/* Page navigation */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => setActivePage((p) => Math.max(0, p - 1))}
                  disabled={activePage === 0}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 disabled:opacity-30 text-sm font-semibold"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <button
                  onClick={() => setActivePage((p) => Math.min(pages.length - 1, p + 1))}
                  disabled={activePage === pages.length - 1}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-30"
                >
                  Next Page <ChevronRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No content available.</p>
          )}
        </div>

        {/* Purchase History (if any) */}
        {note.purchases && note.purchases.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User size={15} className="text-gray-400" /> Purchase History
            </h3>
            <div className="space-y-2">
              {note.purchases.slice(0, 5).map((purchase: any) => (
                <div key={purchase._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{purchase.buyerName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{purchase.buyerEmail || 'No email'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₦{purchase.amountPaid.toLocaleString('en-NG')}</p>
                    <p className="text-xs text-gray-400">{new Date(purchase.createdAt).toLocaleDateString('en-NG')}</p>
                  </div>
                </div>
              ))}
              {note.purchases.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+ {note.purchases.length - 5} more purchases</p>
              )}
            </div>
          </div>
        )}

        {/* Admin actions */}
        {note.status === 'pending_approval' && (
          rejecting ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 mt-4">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Rejection reason..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRejecting(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={reject}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 mt-4 sticky bottom-4">
              <button
                onClick={approve}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold"
              >
                <CheckCircle2 size={15} /> Approve & Publish
              </button>
              <button
                onClick={() => setRejecting(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold"
              >
                <XCircle size={15} /> Reject
              </button>
            </div>
          )
        )}

        {note.status === 'rejected' && note.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
            <p className="text-xs font-semibold text-red-600">Rejection Reason:</p>
            <p className="text-sm text-red-700">{note.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  )
}