// components/tutor/LessonNotesList.tsx
'use client'

import { useEffect, useState } from 'react'
import { Plus, FileText, DollarSign, ShoppingBag } from 'lucide-react'
import { LESSON_NOTE_CLASSES, SS_CATEGORIES, isJssClass, getSubjectsFor } from '@/lib/lessonNoteSubjects'

interface Note { _id: string; title: string; coverImageUrl: string | null; price: number; status: string; subject: string; studentClass: string; purchaseCount: number; weekCount: number }

export default function LessonNotesList() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => fetch('/api/tutor/lesson-notes').then((r) => r.json()).then((d) => setNotes(d.notes || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const jss = studentClass ? isJssClass(studentClass) : false
  const subjects = studentClass ? getSubjectsFor(studentClass, category) : []

  const create = async () => {
    if (!title.trim() || !studentClass || !subject) return
    setCreating(true)
    try {
      const res = await fetch('/api/tutor/lesson-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, studentClass, category: jss ? undefined : category, subject }),
      })
      const data = await res.json()
      if (res.ok) window.location.href = `/dashboard/tutor/lesson-notes/${data.noteId}`
    } finally { setCreating(false) }
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sell Lesson Notes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create and sell structured lesson notes by class and subject.</p>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"><Plus size={15} /> New Note</button>
        </div>

        {showNew && (
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-4 space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson note title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <select value={studentClass} onChange={(e) => { setStudentClass(e.target.value); setCategory(''); setSubject('') }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select class...</option>
              {LESSON_NOTE_CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {studentClass && !jss && (
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubject('') }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select category...</option>
                {SS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
            {(jss || category) && (
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select subject...</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <button onClick={create} disabled={creating || !subject} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
              <button onClick={() => setShowNew(false)} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}

        {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((n) => (
              <a key={n._id} href={`/dashboard/tutor/lesson-notes/${n._id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm">
                <div className="h-28 bg-gray-100">{n.coverImageUrl ? <img src={n.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-7 h-7 text-gray-300" /></div>}</div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.status === 'published' ? 'bg-green-100 text-green-700' : n.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' : n.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{n.status.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-600"><DollarSign size={11} /> {n.price === 0 ? 'Free' : `₦${n.price.toLocaleString('en-NG')}`}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate">{n.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{n.subject} · {n.studentClass.toUpperCase()}</p>
                  <p className="flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1.5"><ShoppingBag size={11} /> {n.purchaseCount} purchase{n.purchaseCount !== 1 ? 's' : ''}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}