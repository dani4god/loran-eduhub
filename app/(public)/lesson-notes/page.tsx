// app/(public)/lesson-notes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Search, FileText, DollarSign } from 'lucide-react'
import { LESSON_NOTE_CLASSES, SS_CATEGORIES, isJssClass, getSubjectsFor } from '@/lib/lessonNoteSubjects'

export default function LessonNotesBrowsePage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')

  const jss = studentClass ? isJssClass(studentClass) : false
  const subjects = studentClass ? getSubjectsFor(studentClass, category) : []

  useEffect(() => {
    const params = new URLSearchParams()
    if (studentClass) params.set('class', studentClass)
    if (category) params.set('category', category)
    if (subject) params.set('subject', subject)
    setLoading(true)
    fetch(`/api/lesson-notes?${params}`).then((r) => r.json()).then((d) => setNotes(d.notes || [])).finally(() => setLoading(false))
  }, [studentClass, category, subject])

  const filtered = notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lesson Notes & Plans</h1>
            <p className="text-gray-500 mt-2 text-sm">Structured, tutor-written lesson notes by class and subject.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8 max-w-3xl mx-auto">
            <div className="relative sm:col-span-4 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <select value={studentClass} onChange={(e) => { setStudentClass(e.target.value); setCategory(''); setSubject('') }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
              <option value="">All Classes</option>
              {LESSON_NOTE_CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {studentClass && !jss && (
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubject('') }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
                <option value="">All Categories</option>
                {SS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
            {(jss || category) && (
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
                <option value="">All Subjects</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          {loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">No lesson notes found for this selection.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((n) => (
                <Link key={n._id} href={`/lesson-notes/${n._id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 bg-gray-100">{n.coverImageUrl ? <img src={n.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-7 h-7 text-gray-300" /></div>}</div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{n.title}</h3>
                    <p className="text-xs text-gray-400 mb-2">{n.subject} · {n.studentClass.toUpperCase()} · by {n.tutorName}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${n.isFree ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}><DollarSign size={11} /> {n.isFree ? 'Free' : `₦${n.price.toLocaleString('en-NG')}`}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}