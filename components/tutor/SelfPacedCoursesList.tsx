// components/tutor/SelfPacedCoursesList.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Layers, DollarSign, Eye, EyeOff, Clock } from 'lucide-react'

interface Course {
  _id: string; title: string; coverImageUrl: string | null; price: number;
  status: string; weekCount: number; updatedAt: string
}

export default function SelfPacedCoursesList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [myCourses, setMyCourses] = useState<{ _id: string; name: string }[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/tutor/self-paced-courses').then((r) => r.json()).then((d) => setCourses(d.courses || [])).finally(() => setLoading(false))
  }
  
  useEffect(() => { load() }, [])

  useEffect(() => {
    fetch('/api/tutor/courses').then((r) => r.json()).then((d) => setMyCourses(d.courses || []))
  }, [])

  const create = async () => {
    if (!title.trim() || !selectedCourseId) return
    setCreating(true)
    try {
      const res = await fetch('/api/tutor/self-paced-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, courseId: selectedCourseId }),
      })
      const data = await res.json()
      if (res.ok) window.location.href = `/dashboard/tutor/self-paced/${data.courseId}`
      else alert(data.error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Self-Paced Courses</h1>
            <p className="text-sm text-gray-500 mt-0.5">Build Udemy-style courses students purchase and complete at their own pace.</p>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus size={15} /> New Course
          </button>
        </div>

        {showNew && (
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-4 space-y-2">
            <select 
              value={selectedCourseId} 
              onChange={(e) => setSelectedCourseId(e.target.value)} 
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select which course this is based on...</option>
              {myCourses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Self-paced course title" 
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" 
            />
            <div className="flex gap-2">
              <button 
                onClick={create} 
                disabled={creating || !selectedCourseId} 
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button 
                onClick={() => setShowNew(false)} 
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No self-paced courses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link key={c._id} href={`/dashboard/tutor/self-paced/${c._id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
                <div className="h-28 bg-gray-100">
                  {c.coverImageUrl ? <img src={c.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-8 h-8 text-gray-300" /></div>}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      c.status === 'published' ? 'bg-green-100 text-green-700' :
                      c.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                      c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {c.status === 'published' ? <Eye size={10} /> : c.status === 'pending_approval' ? <Clock size={10} /> : <EyeOff size={10} />}
                      {c.status === 'pending_approval' ? 'Pending Review' : c.status}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                      <DollarSign size={11} /> {c.price === 0 ? 'Free' : `₦${c.price.toLocaleString('en-NG')}`}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate">{c.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{c.weekCount} week{c.weekCount !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}