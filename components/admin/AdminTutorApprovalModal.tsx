// components/admin/AdminTutorApprovalModal.tsx
'use client'

import { useState } from 'react'
import { X, CheckCircle2, Loader2 } from 'lucide-react'

interface Course { _id: string; name: string; category: string }
interface Props {
  tutor: { _id: string; firstName: string; lastName: string; email: string; courses: Course[] } // courses = what they APPLIED for
  onClose: () => void
  onApproved: () => void
}

export default function AdminTutorApprovalModal({ tutor, onClose, onApproved }: Props) {
  const [selected, setSelected] = useState<string[]>(tutor.courses.map((c) => c._id)) // default: all applied courses checked
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const approve = async () => {
    if (selected.length === 0) {
      setError('Select at least one course')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/tutors/${tutor._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: selected }),
      })
      const data = await res.json()
      if (res.ok) {
        onApproved()
        onClose()
      } else {
        setError(data.error || 'Failed to approve')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">Assign Courses & Approve</h2>
            <p className="text-xs text-gray-400">{tutor.firstName} {tutor.lastName} · {tutor.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-500">
            Select which of the courses this tutor applied for they'll actually be assigned to teach. All are checked by default.
          </p>

          <div className="space-y-1.5">
            {tutor.courses.map((c) => (
              <label key={c._id} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer ${selected.includes(c._id) ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
                <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <p className="text-[11px] text-gray-400">{c.category}</p>
                </div>
              </label>
            ))}
            {tutor.courses.length === 0 && <p className="text-sm text-gray-400">This tutor didn't select any courses during application.</p>}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            onClick={approve}
            disabled={submitting || tutor.courses.length === 0}
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            {submitting ? 'Approving...' : `Approve with ${selected.length} Course${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}