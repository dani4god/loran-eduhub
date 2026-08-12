// components/admin/ScheduleInterviewModal.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { X, Calendar, MapPin, Link as LinkIcon, User, Send, Loader2, History } from 'lucide-react'

interface Props {
  tutor: { _id: string; firstName: string; lastName: string; email: string }
  onClose: () => void
}

interface PastInvite {
  _id: string; scheduledDate: string; venue: string; meetingLink: string | null; hrName: string; sentAt: string
}

export default function ScheduleInterviewModal({ tutor, onClose }: Props) {
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [hrName, setHrName] = useState('')
  const [sending, setSending] = useState(false)
  const [pastInvites, setPastInvites] = useState<PastInvite[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/tutors/${tutor._id}/interview`)
      .then((r) => r.json())
      .then((d) => setPastInvites(d.invites || []))
      .finally(() => setLoadingHistory(false))
  }, [tutor._id])

  const send = async () => {
    if (!date || !venue.trim() || !hrName.trim()) {
      toast.error('Date, venue, and HR team member name are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/admin/tutors/${tutor._id}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: new Date(date).toISOString(),
          venue,
          meetingLink: meetingLink || undefined,
          hrName,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Interview invitation sent to ${tutor.email}`)
        onClose()
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-xs text-gray-400">{tutor.firstName} {tutor.lastName} · {tutor.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar size={12} /> Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin size={12} /> Venue
            </label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Google Meet / Zoom / Loran EduHub Office"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <LinkIcon size={12} /> Meeting Link (optional)
            </label>
            <input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={12} /> HR Team Member Name
            </label>
            <input
              value={hrName}
              onChange={(e) => setHrName(e.target.value)}
              placeholder="e.g. Chidinma Eze"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">This name signs the invitation email.</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            A professional interview invitation will be generated automatically — including the 15-minute
            mock teaching request — and emailed to <strong>{tutor.email}</strong>.
          </div>

          <button
            onClick={send}
            disabled={sending}
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sending ? 'Sending...' : 'Send Interview Invitation'}
          </button>

          {!loadingHistory && pastInvites.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <History size={12} /> Previously Sent
              </p>
              <div className="space-y-2">
                {pastInvites.map((inv) => (
                  <div key={inv._id} className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600">
                    <p className="font-medium text-gray-800">
                      {new Date(inv.scheduledDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-gray-400">{inv.venue} · signed by {inv.hrName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}