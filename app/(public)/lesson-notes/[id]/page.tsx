// app/(public)/lesson-notes/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SelfPacedContent from '@/components/self-paced/SelfPacedContent'
import PreviewVideoEmbed from '@/components/self-paced/PreviewVideoEmbed'
import LessonNoteFooterAd from '@/components/lesson-notes/LessonNoteFooterAd'
import { Lock, User } from 'lucide-react'

export default function LessonNoteDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [note, setNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch(`/api/lesson-notes/${id}/public`).then((r) => r.json()).then(setNote).finally(() => setLoading(false)) }, [id])

  if (loading || !note) return <><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div><Footer /></>
  if (note.error) return <><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><p className="text-gray-400 text-sm">Not found.</p></div><Footer /></>

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            {note.coverImageUrl && <img src={note.coverImageUrl} className="w-full h-48 object-cover" />}
            <div className="p-5 sm:p-7">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{note.title}</h1>
              <p className="text-sm text-gray-400 mb-3">{note.subject} · {note.studentClass.toUpperCase()}</p>
              {note.tutor && <p className="flex items-center gap-1.5 text-sm text-gray-600 mb-3"><User size={14} /> {note.tutor.firstName} {note.tutor.lastName}</p>}
              <p className="text-sm text-gray-600 mb-4">{note.description}</p>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${note.isFree ? 'text-green-600' : 'text-blue-600'}`}>{note.isFree ? 'Free' : `₦${note.price.toLocaleString('en-NG')}`}</span>
                <Link href={`/lesson-notes/${id}/purchase`} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold">{note.isFree ? 'Get This Note' : 'Purchase Now'}</Link>
              </div>
            </div>
          </div>

          {note.previewVideoUrl && <div className="mb-6"><h2 className="text-lg font-bold text-gray-900 mb-3">Preview</h2><PreviewVideoEmbed url={note.previewVideoUrl} /></div>}

          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Preview Content (Weeks 1–2)</h2>
            {note.previewWeeks.map((w: any) => (
              <div key={w.weekNumber} className="mb-5">
                <p className="text-sm font-bold text-gray-800 mb-2">Week {w.weekNumber}: {w.title}</p>
                {w.pages.map((p: any, i: number) => <div key={i} className="mb-3"><p className="text-xs font-semibold text-blue-600 mb-1">{p.title}</p><SelfPacedContent html={p.content} /></div>)}
              </div>
            ))}
            {note.lockedWeekTitles.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                {note.lockedWeekTitles.map((w: any) => <p key={w.weekNumber} className="flex items-center gap-2 text-sm text-gray-500"><Lock size={13} /> Week {w.weekNumber}: {w.title}</p>)}
              </div>
            )}
          </div>

          <LessonNoteFooterAd />
        </div>
      </div>
      <Footer />
    </>
  )
}