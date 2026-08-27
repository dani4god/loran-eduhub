// components/admin/TutorCourseEditor.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BookOpen, Save, Loader2 } from 'lucide-react'

export default function TutorCourseEditor({ tutorId, currentCourseIds, onSaved }: { tutorId: string; currentCourseIds: string[]; onSaved: () => void }) {
  const [allCourses, setAllCourses] = useState<{ _id: string; name: string; category: string }[]>([])
  const [selected, setSelected] = useState<string[]>(currentCourseIds)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/courses').then((r) => r.json()).then((d) => setAllCourses(d.courses || []))
  }, [])

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tutors/${tutorId}/courses`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseIds: selected }),
      })
      if (res.ok) { toast.success('Courses updated'); onSaved() }
      else toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"><BookOpen size={12} /> Assigned Courses</p>
      <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
        {allCourses.map((c) => (
          <label key={c._id} className="flex items-center gap-2 text-xs py-1">
            <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} />
            {c.name} <span className="text-gray-400">({c.category})</span>
          </label>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Courses
      </button>
    </div>
  )
}