// components/admin/LiveExamsManager.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Radio, Plus, Trash2, Eye, EyeOff, Save, Loader2, X } from 'lucide-react'
import QuestionEditor from '@/components/library/QuestionEditor'

interface LiveExamItem {
  _id: string
  title: string
  description: string
  requirements: string
  scheduledDate: string
  durationMinutes: number
  status: string
  questions: any[]
}

export default function LiveExamsManager() {
  const [exams, setExams] = useState<LiveExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<LiveExamItem | null>(null)

  const load = () => fetch('/api/admin/live-exams').then((r) => r.json()).then((d) => setExams(d.exams || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newTitle.trim() || !newDate) { toast.error('Title and date are required'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/live-exams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, scheduledDate: newDate, durationMinutes: 60 }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Exam created')
        setNewTitle(''); setNewDate(''); setShowNew(false)
        load()
      } else toast.error(data.error)
    } finally {
      setCreating(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this exam?')) return
    await fetch(`/api/admin/live-exams/${id}`, { method: 'DELETE' })
    toast.success('Deleted')
    load()
  }

  const togglePublish = async (exam: LiveExamItem) => {
    const desired = exam.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/admin/live-exams/${exam._id}/publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: desired }),
    })
    const data = await res.json()
    if (res.ok) { toast.success(desired === 'published' ? 'Published' : 'Unpublished'); load() }
    else toast.error(data.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Live Exams</h1>
          <p className="text-gray-500 text-sm mt-0.5">Schedule and publish live practice exam events.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"><Plus size={15} /> New Exam</button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl border-2 border-red-100 p-4 space-y-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Exam title (e.g. JAMB Mock — March Edition)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={create} disabled={creating} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
            <button onClick={() => setShowNew(false)} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Radio className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No live exams scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {exams.map((e) => (
            <div key={e._id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{e.title}</p>
                  <p className="text-xs text-gray-400">{new Date(e.scheduledDate).toLocaleString('en-NG')} · {e.durationMinutes} min · {e.questions.length} questions</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${e.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(e)} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700">Edit Details & Questions</button>
                <button onClick={() => togglePublish(e)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold ${e.status === 'published' ? 'bg-orange-50 text-orange-600' : 'bg-green-600 text-white'}`}>
                  {e.status === 'published' ? <><EyeOff size={12} /> Unpublish</> : <><Eye size={12} /> Publish</>}
                </button>
                <button onClick={() => remove(e._id)} className="px-3 py-2 text-red-500 border border-red-200 rounded-lg"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <LiveExamEditModal exam={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  )
}

function LiveExamEditModal({ exam, onClose, onSaved }: { exam: LiveExamItem; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(exam.title)
  const [description, setDescription] = useState(exam.description || '')
  const [requirements, setRequirements] = useState(exam.requirements || '')
  const [scheduledDate, setScheduledDate] = useState(new Date(exam.scheduledDate).toISOString().slice(0, 16))
  const [durationMinutes, setDurationMinutes] = useState(exam.durationMinutes)
  const [questions, setQuestions] = useState(exam.questions || [])
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/live-exams/${exam._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, requirements, scheduledDate, durationMinutes, questions }),
      })
      if (res.ok) { toast.success('Saved'); onSaved(); onClose() } else toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
          <h2 className="text-base font-bold text-gray-900">Edit Live Exam</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
        </div>

        <div className="p-5 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (shown to students)" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Requirements (e.g. 'Bring a calculator', 'Stable internet required')" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date & Time</label>
              <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Duration (minutes)</label>
              <input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Exam Questions</p>
            <QuestionEditor questions={questions as any} onChange={setQuestions} />
          </div>

          <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}