// components/tutor/LessonNoteBuilder.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Upload, Loader2, Eye, EyeOff, Save, AlertTriangle,
} from 'lucide-react'
import RichTextEditor from '@/components/library/RichTextEditor'
import LinkEditor from '@/components/library/LinkEditor'

interface Page { _id?: string; title: string; content: string; links: any[] }
interface Week { _id?: string; weekNumber: number; title: string; pages: Page[] }

export default function LessonNoteBuilder({ noteId }: { noteId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [previewVideoUrl, setPreviewVideoUrl] = useState('')
  const [price, setPrice] = useState(0)
  const [status, setStatus] = useState('draft')
  const [subject, setSubject] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [weeks, setWeeks] = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedPage, setSelectedPage] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')
  const saveTimer = useRef<any>(null)

  useEffect(() => {
    fetch(`/api/tutor/lesson-notes/${noteId}`).then((r) => r.json()).then((d) => {
      const n = d.note
      setTitle(n.title); setDescription(n.description || ''); setCoverImageUrl(n.coverImageUrl);
      setPreviewVideoUrl(n.previewVideoUrl || ''); setPrice(n.price); setStatus(n.status);
      setSubject(n.subject); setStudentClass(n.studentClass);
      setWeeks(n.weeks.length ? n.weeks : []);
    }).finally(() => setLoading(false))
  }, [noteId])

  const scheduleSave = () => {
    if (status === 'published') return
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 1200)
  }

  const doSave = async () => {
    const res = await fetch(`/api/tutor/lesson-notes/${noteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, coverImageUrl, previewVideoUrl, price, weeks }),
    })
    if (res.ok) setSaveStatus('saved')
  }

  useEffect(() => {
    if (loading) return
    scheduleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, coverImageUrl, previewVideoUrl, price, weeks])

  const uploadCover = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setCoverImageUrl(data.url)
    } finally { setUploading(false) }
  }

  const addWeek = () => {
    const w: Week = { weekNumber: weeks.length + 1, title: `Week ${weeks.length + 1}`, pages: [{ title: 'Page 1', content: '', links: [] }] }
    setWeeks([...weeks, w]); setSelectedWeek(weeks.length); setSelectedPage(0)
  }
  const removeWeek = (idx: number) => {
    if (!confirm('Delete this week?')) return
    setWeeks(weeks.filter((_, i) => i !== idx).map((w, i) => ({ ...w, weekNumber: i + 1 })))
    setSelectedWeek(null)
  }
  const updateWeek = (idx: number, field: string, value: any) => {
    const next = [...weeks]; (next[idx] as any)[field] = value; setWeeks(next)
  }
  const addPage = (weekIdx: number) => {
    const next = [...weeks]; next[weekIdx].pages.push({ title: `Page ${next[weekIdx].pages.length + 1}`, content: '', links: [] })
    setWeeks(next); setSelectedPage(next[weekIdx].pages.length - 1)
  }
  const removePage = (weekIdx: number, pageIdx: number) => {
    if (weeks[weekIdx].pages.length <= 1) { alert('A week needs at least one page.'); return }
    const next = [...weeks]; next[weekIdx].pages = next[weekIdx].pages.filter((_, i) => i !== pageIdx)
    setWeeks(next); setSelectedPage(Math.max(0, pageIdx - 1))
  }
  const updatePage = (weekIdx: number, pageIdx: number, field: string, value: any) => {
    const next = [...weeks]; (next[weekIdx].pages[pageIdx] as any)[field] = value; setWeeks(next)
  }

  const publish = async (desired: string) => {
    await doSave()
    const res = await fetch(`/api/tutor/lesson-notes/${noteId}/publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: desired }),
    })
    const data = await res.json()
    if (res.ok) setStatus(data.status); else alert(data.error)
  }

  const deleteNote = async () => {
    if (!confirm('Delete this lesson note permanently?')) return
    const res = await fetch(`/api/tutor/lesson-notes/${noteId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) router.push('/dashboard/tutor/lesson-notes'); else alert(data.error)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const week = selectedWeek !== null ? weeks[selectedWeek] : null
  const page = week ? week.pages[selectedPage] : null
  const locked = status === 'published'

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <Link href="/dashboard/tutor/lesson-notes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"><ArrowLeft size={18} /></Link>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} className="flex-1 min-w-[140px] font-bold text-gray-900 text-base outline-none disabled:bg-transparent" />
          <span className="text-xs text-gray-400 shrink-0">{subject} · {studentClass.toUpperCase()}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status === 'published' ? 'bg-green-100 text-green-700' : status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{status.replace('_', ' ')}</span>
          {!locked && <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">{saveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving...</>}{saveStatus === 'saved' && <><Save size={12} /> Saved</>}</span>}

          {status === 'draft' && <><button onClick={() => publish('pending_approval')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shrink-0"><Eye size={15} /> Submit for Review</button><button onClick={deleteNote} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0"><Trash2 size={15} /> Delete</button></>}
          {status === 'pending_approval' && <span className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-semibold shrink-0">Pending Admin Review</span>}
          {status === 'published' && <><button onClick={() => publish('draft')} className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-semibold shrink-0"><EyeOff size={15} /> Unpublish to Edit</button><button onClick={deleteNote} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0"><Trash2 size={15} /> Delete</button></>}
          {status === 'rejected' && <><button onClick={() => publish('pending_approval')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shrink-0"><Eye size={15} /> Resubmit</button><button onClick={deleteNote} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0"><Trash2 size={15} /> Delete</button></>}
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-4 border-t border-gray-50">
          {(['content', 'settings'] as const).map((t) => <button key={t} onClick={() => setActiveTab(t)} className={`py-2.5 text-sm font-semibold capitalize border-b-2 ${activeTab === t ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent'}`}>{t}</button>)}
        </div>
      </div>

      {locked && <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3"><div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-orange-600 shrink-0" /><p className="text-xs text-orange-700">Published — unpublish to edit, then resubmit for review.</p></div></div>}

      <fieldset disabled={locked} className={locked ? 'opacity-60 pointer-events-none' : ''}>
        {activeTab === 'content' && (
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
            <div className="w-full lg:w-64 shrink-0 border-r border-gray-100 p-4 space-y-1">
              <button onClick={addWeek} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold mb-2"><Plus size={14} /> Add Week</button>
              {weeks.map((w, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer group ${selectedWeek === i ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <span onClick={() => { setSelectedWeek(i); setSelectedPage(0) }} className="flex-1 text-sm font-medium truncate">Week {w.weekNumber}: {w.title}</span>
                  <button onClick={() => removeWeek(i)} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0 p-4 sm:p-6">
              {!week ? <p className="text-gray-400 text-sm text-center py-16">Select or add a week.</p> : (
                <div className="max-w-3xl space-y-5">
                  <input value={week.title} onChange={(e) => updateWeek(selectedWeek!, 'title', e.target.value)} className="w-full text-xl font-bold text-gray-900 outline-none border-b border-transparent focus:border-gray-200 pb-2" />
                  <div className="flex items-center gap-1.5 flex-wrap border-b border-gray-100 pb-3">
                    {week.pages.map((p, pi) => <button key={pi} onClick={() => setSelectedPage(pi)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedPage === pi ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Page {pi + 1}</button>)}
                    <button onClick={() => addPage(selectedWeek!)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold"><Plus size={12} /> Add Page</button>
                    {week.pages.length > 1 && <button onClick={() => removePage(selectedWeek!, selectedPage)} className="flex items-center gap-1 px-3 py-1.5 text-red-500 rounded-lg text-xs font-semibold"><Trash2 size={12} /> Remove</button>}
                  </div>
                  {page && (
                    <>
                      <input value={page.title} onChange={(e) => updatePage(selectedWeek!, selectedPage, 'title', e.target.value)} className="w-full text-sm font-semibold text-gray-800 outline-none border-b border-transparent focus:border-gray-200 pb-1.5" />
                      <RichTextEditor resetKey={`ln-week-${selectedWeek}-page-${selectedPage}`} value={page.content} onChange={(html) => updatePage(selectedWeek!, selectedPage, 'content', html)} placeholder="Write this page's lesson notes — add images and videos..." />
                      <LinkEditor links={page.links} onChange={(links) => updatePage(selectedWeek!, selectedPage, 'links', links)} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cover, Preview & Pricing</p>
              <div className="flex items-center gap-4 mb-4">
                {coverImageUrl ? <img src={coverImageUrl} className="w-24 h-16 rounded-lg object-cover" /> : <div className="w-24 h-16 rounded-lg bg-gray-100 flex items-center justify-center"><Upload size={18} className="text-gray-300" /></div>}
                <label className="text-xs font-semibold text-blue-600 cursor-pointer">{uploading ? 'Uploading...' : 'Upload Cover Image'}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} /></label>
              </div>
              <label className="text-xs text-gray-500 mb-1 block">Preview Video (optional)</label>
              <input value={previewVideoUrl} onChange={(e) => setPreviewVideoUrl(e.target.value)} placeholder="YouTube or Loom link" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
              <label className="text-xs text-gray-500 mb-1 block">Price (₦, 0 = free)</label>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        )}
      </fieldset>
    </div>
  )
}