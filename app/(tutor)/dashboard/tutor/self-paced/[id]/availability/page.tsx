'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react'

export default function AvailabilityPage() {
  const params = useParams()
  const courseId = params.id as string
  const [slots, setSlots] = useState<any[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => fetch(`/api/tutor/availability?courseId=${courseId}`).then((r) => r.json()).then((d) => setSlots(d.slots || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [courseId])

  const addSlot = async () => {
    if (!date || !startTime || !endTime) return
    await fetch('/api/tutor/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, date, startTime, endTime }),
    })
    setDate(''); setStartTime(''); setEndTime('')
    load()
  }

  const removeSlot = async (id: string) => {
    await fetch(`/api/tutor/availability/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <Link href={`/dashboard/tutor/self-paced/${courseId}`} className="flex items-center gap-1.5 text-sm text-gray-500"><ArrowLeft size={15} /> Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Coaching Availability</h1>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button onClick={addSlot} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"><Plus size={14} /> Add Slot</button>
        </div>

        {loading ? <div className="py-10 text-center"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <div className="space-y-2">
            {slots.map((s) => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <Clock size={15} className="text-blue-500 shrink-0" />
                <p className="flex-1 text-sm text-gray-700">{new Date(s.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} · {s.startTime}–{s.endTime}</p>
                {s.isBooked ? <span className="text-xs font-semibold text-green-600">Booked</span> : <button onClick={() => removeSlot(s._id)}><Trash2 size={14} className="text-gray-400 hover:text-red-500" /></button>}
              </div>
            ))}
            {slots.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No slots added yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}