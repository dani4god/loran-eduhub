// components/tutor/CoachingBookingsInbox.tsx
'use client'

import { useEffect, useState } from 'react'
import { Phone, MessageSquare, Send, ExternalLink } from 'lucide-react'

export default function CoachingBookingsInbox() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')

  const load = () => fetch('/api/tutor/coaching-bookings').then((r) => r.json()).then((d) => setBookings(d.bookings || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const sendReply = async (id: string) => {
    await fetch(`/api/tutor/coaching-bookings/${id}/reply`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, link }),
    })
    setReplyingId(null); setMessage(''); setLink('')
    load()
  }

  if (loading) return <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>

  return (
    <div className="space-y-2.5">
      {bookings.length === 0 ? <p className="text-center text-gray-400 text-sm py-10">No coaching bookings yet.</p> : bookings.map((b) => (
        <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{b.studentName}</p>
              <p className="text-xs text-gray-400">{b.courseName} · {new Date(b.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} {b.startTime}–{b.endTime}</p>
            </div>
            <span className="text-xs font-bold text-green-600">₦{b.amountPaid.toLocaleString('en-NG')}</span>
          </div>

          <div className="flex gap-2 mb-2">
            <a href={`https://wa.me/${b.studentPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-green-600"><Phone size={12} /> WhatsApp</a>
          </div>

          {b.tutorReplyMessage ? (
            <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600">
              <p>{b.tutorReplyMessage}</p>
              {b.tutorReplyLink && <a href={b.tutorReplyLink} className="text-blue-600 flex items-center gap-1 mt-1"><ExternalLink size={11} /> {b.tutorReplyLink}</a>}
            </div>
          ) : replyingId === b._id ? (
            <div className="space-y-2">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Class link, procedure to join Discord, etc." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs" />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Meeting link" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs" />
              <button onClick={() => sendReply(b._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"><Send size={12} /> Send Reply</button>
            </div>
          ) : (
            <button onClick={() => setReplyingId(b._id)} className="flex items-center gap-1 text-xs font-semibold text-blue-600"><MessageSquare size={12} /> Reply via Dashboard</button>
          )}
        </div>
      ))}
    </div>
  )
}