'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Script from 'next/script'
import { Calendar, Loader2 } from 'lucide-react'

declare global { interface Window { PaystackPop: any } }

export default function BookCoachingPage() {
  const params = useParams()
  const courseId = params.id as string
  const [slots, setSlots] = useState<any[]>([])
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [booking, setBooking] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { fetch(`/api/self-paced/availability?courseId=${courseId}`).then((r) => r.json()).then((d) => setSlots(d.slots || [])) }, [courseId])

  const book = async (slotId: string) => {
    setBooking(slotId)
    try {
      const res = await fetch('/api/self-paced/booking/initiate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, slotId }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage(data.error); setBooking(null); return }

      const handler = window.PaystackPop.setup({
        key: data.publicKey, email: data.email, amount: Math.round(data.amount * 100), ref: data.reference, currency: 'NGN',
        callback: (r: any) => {
          fetch(`/api/self-paced/booking/verify?reference=${r.reference}`).then((res) => res.json()).then((d) => {
            setMessage(d.success ? 'Booking confirmed! Your tutor will reach out via WhatsApp or your dashboard.' : d.error)
          }).finally(() => setBooking(null))
        },
        onClose: () => setBooking(null),
      })
      handler.openIframe()
    } catch { setBooking(null) }
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" onLoad={() => setScriptLoaded(true)} strategy="afterInteractive" />
      <div className="pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Book 1-on-1 Coaching</h1>
          <p className="text-sm text-gray-500 mb-5">Pick an available slot and pay to confirm.</p>
          {message && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-3 mb-4">{message}</p>}
          <div className="space-y-2">
            {slots.map((s) => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <Calendar size={15} className="text-blue-500 shrink-0" />
                <p className="flex-1 text-sm text-gray-700">{new Date(s.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} · {s.startTime}–{s.endTime}</p>
                <button onClick={() => book(s._id)} disabled={booking === s._id || !scriptLoaded} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                  {booking === s._id && <Loader2 size={12} className="animate-spin" />} Book
                </button>
              </div>
            ))}
            {slots.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No slots available right now.</p>}
          </div>
        </div>
      </div>
    </>
  )
}