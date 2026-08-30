'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import SelfPacedContent from '@/components/self-paced/SelfPacedContent'
import {
  ArrowLeft, CheckCircle2, XCircle, ChevronLeft,
  ChevronRight, FileText, Link as LinkIcon,
} from 'lucide-react'

interface LNPage {
  _id?: string
  title: string
  content: string
  links: { label: string; url: string }[]
}

interface LNWeek {
  _id?: string
  weekNumber: number
  title: string
  pages: LNPage[]
}

// Flat list entry for navigation
interface FlatPage {
  weekNumber: number
  weekTitle: string
  pageIndex: number
  pageTitle: string
  content: string
  links: { label: string; url: string }[]
}

function flattenWeeks(weeks: LNWeek[]): FlatPage[] {
  const flat: FlatPage[] = []
  for (const week of weeks) {
    for (let i = 0; i < week.pages.length; i++) {
      const page = week.pages[i]
      flat.push({
        weekNumber: week.weekNumber,
        weekTitle: week.title,
        pageIndex: i,
        pageTitle: page.title,
        content: page.content ?? '',
        links: page.links ?? [],
      })
    }
  }
  return flat
}

export default function AdminLessonNoteDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [note, setNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [flatPages, setFlatPages] = useState<FlatPage[]>([])
  const [activeFlatIdx, setActiveFlatIdx] = useState(0)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetch(`/api/admin/lesson-notes/${id}`)
      .then(r => r.json())
      .then(d => {
        const n = d.note
        setNote(n)
        if (n?.weeks?.length) {
          setFlatPages(flattenWeeks(n.weeks))
        }
      })
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
    if (!reason.trim()) { toast.error('Enter a rejection reason'); return }
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

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        Lesson note not found.
      </div>
    )
  }

  const currentPage = flatPages[activeFlatIdx] ?? null
  const totalPages = flatPages.length
  const hasContent = totalPages > 0

  // Group flat pages by week for sidebar
  const weekGroups: { weekNumber: number; weekTitle: string; flatIndices: number[] }[] = []
  flatPages.forEach((fp, idx) => {
    const existing = weekGroups.find(g => g.weekNumber === fp.weekNumber)
    if (existing) {
      existing.flatIndices.push(idx)
    } else {
      weekGroups.push({ weekNumber: fp.weekNumber, weekTitle: fp.weekTitle, flatIndices: [idx] })
    }
  })

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5">

      {/* ── Sidebar ── */}
      <div className="lg:w-64 shrink-0 space-y-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* Note meta card */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            {note.coverImageUrl ? (
              <img src={note.coverImageUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
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

          <div className="border-t border-gray-100 pt-3 space-y-1.5 text-[11px]">
            {[
              { label: 'Status', value: note.status?.replace(/_/g, ' '), className: note.status === 'published' ? 'text-green-600' : note.status === 'pending_approval' ? 'text-yellow-600' : note.status === 'rejected' ? 'text-red-600' : 'text-gray-600' },
              { label: 'Price', value: note.price === 0 ? 'Free' : `₦${note.price.toLocaleString('en-NG')}` },
              { label: 'Purchases', value: note.purchaseCount ?? 0 },
              { label: 'Subject', value: note.subject || 'General' },
              { label: 'Class', value: note.studentClass || 'All' },
              { label: 'Weeks', value: note.weeks?.length ?? 0 },
              { label: 'Total Pages', value: totalPages },
            ].map(row => (
              <p key={row.label} className="flex items-center justify-between text-gray-400">
                <span>{row.label}</span>
                <span className={`font-semibold capitalize ${(row as any).className ?? 'text-gray-800'}`}>
                  {row.value}
                </span>
              </p>
            ))}
          </div>

          {note.description && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">{note.description}</p>
            </div>
          )}
        </div>

        {/* Week / page navigation */}
        {weekGroups.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-3 max-h-96 overflow-y-auto">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Content
            </p>
            <div className="space-y-2">
              {weekGroups.map(group => (
                <div key={group.weekNumber}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1">
                    Week {group.weekNumber}: {group.weekTitle}
                  </p>
                  {group.flatIndices.map(flatIdx => {
                    const fp = flatPages[flatIdx]
                    return (
                      <button
                        key={flatIdx}
                        onClick={() => setActiveFlatIdx(flatIdx)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
                          activeFlatIdx === flatIdx
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {fp.pageTitle || `Page ${fp.pageIndex + 1}`}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
          {hasContent && currentPage ? (
            <>
              {/* Header */}
              <div className="mb-5">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span className="font-semibold text-blue-600">
                    Week {currentPage.weekNumber}: {currentPage.weekTitle}
                  </span>
                  <span>·</span>
                  <span>
                    Page {activeFlatIdx + 1} of {totalPages}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {currentPage.pageTitle}
                </h2>
              </div>

              {/* Content */}
              {currentPage.content ? (
                <div className="prose prose-sm max-w-none">
                  <SelfPacedContent html={currentPage.content} />
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic py-4">
                  This page has no written content.
                </p>
              )}

              {/* Links */}
              {currentPage.links && currentPage.links.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Resources
                  </p>
                  <div className="space-y-1.5">
                    {currentPage.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <LinkIcon size={13} className="shrink-0" />
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Page navigation */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
                <button
                  onClick={() => setActiveFlatIdx(i => Math.max(0, i - 1))}
                  disabled={activeFlatIdx === 0}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 disabled:opacity-30 text-sm font-semibold hover:bg-gray-50 rounded-lg transition"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span className="text-xs text-gray-400">
                  {activeFlatIdx + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setActiveFlatIdx(i => Math.min(totalPages - 1, i + 1))}
                  disabled={activeFlatIdx === totalPages - 1}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-30"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </>
          ) : (
            // No weeks/pages at all
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No content available</p>
              <p className="text-gray-300 text-xs mt-1">
                This lesson note has no weeks or pages yet.
              </p>
            </div>
          )}
        </div>

        {/* Admin actions */}
        {note.status === 'pending_approval' && (
          rejecting ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 mt-4">
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Rejection reason..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRejecting(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={reject}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 mt-4 sticky bottom-4">
              <button
                onClick={approve}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200"
              >
                <CheckCircle2 size={15} /> Approve & Publish
              </button>
              <button
                onClick={() => setRejecting(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
              >
                <XCircle size={15} /> Reject
              </button>
            </div>
          )
        )}

        {note.status === 'rejected' && note.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
            <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{note.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  )
}