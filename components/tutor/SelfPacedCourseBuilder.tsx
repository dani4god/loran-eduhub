// components/tutor/SelfPacedCourseBuilder.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Upload, Loader2, Eye, EyeOff, Save, Users,
  Calendar, MessageSquare, ChevronLeft, ChevronRight, AlertTriangle, PenTool,
  X,
} from 'lucide-react'
import RichTextEditor from '@/components/library/RichTextEditor'
import QuestionEditor from '@/components/library/QuestionEditor'
import LinkEditor from '@/components/library/LinkEditor'

interface Question { type: string; question: string; options?: string[]; correctAnswer: string; marks: number }
interface Page { _id?: string; title: string; content: string; links: any[] }
interface Week { _id?: string; weekNumber: number; title: string; pages: Page[]; exam: { durationMinutes: number; questions: Question[] } }

export default function SelfPacedCourseBuilder({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [price, setPrice] = useState(0)
  const [status, setStatus] = useState('draft')
  const [weeks, setWeeks] = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedPage, setSelectedPage] = useState<number>(0)
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([])
  const [newOutcome, setNewOutcome] = useState('')

  const [coachingEnabled, setCoachingEnabled] = useState(false)
  const [coachingHourlyRate, setCoachingHourlyRate] = useState(0)
  const [discordEnabled, setDiscordEnabled] = useState(true)
  const [discordDescription, setDiscordDescription] = useState('')
  const [workshopEnabled, setWorkshopEnabled] = useState(false)
  const [workshopDay, setWorkshopDay] = useState('')
  const [workshopTime, setWorkshopTime] = useState('')
  const [workshopDesc, setWorkshopDesc] = useState('')

  const [uploading, setUploading] = useState(false)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')
  const saveTimer = useRef<any>(null)

  useEffect(() => {
    fetch(`/api/tutor/self-paced-courses/${courseId}`).then((r) => r.json()).then((d) => {
      const c = d.course
      setTitle(c.title); setDescription(c.description || ''); setCoverImageUrl(c.coverImageUrl);
      setPrice(c.price); setStatus(c.status);
      setWeeks(c.weeks.length ? c.weeks : []);
      setLearningOutcomes(c.learningOutcomes || []);
      setCoachingEnabled(c.coachingEnabled); setCoachingHourlyRate(c.coachingHourlyRate);
      setDiscordEnabled(c.discordEnabled); setDiscordDescription(c.discordDescription || '');
      setWorkshopEnabled(c.weeklyWorkshop?.enabled || false);
      setWorkshopDay(c.weeklyWorkshop?.dayOfWeek || ''); setWorkshopTime(c.weeklyWorkshop?.time || '');
      setWorkshopDesc(c.weeklyWorkshop?.description || '');
    }).finally(() => setLoading(false))
  }, [courseId])

  const scheduleSave = () => {
    if (status === 'published') return // locked, never autosave over a live course
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 1200)
  }

  const doSave = async () => {
    const res = await fetch(`/api/tutor/self-paced-courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, coverImageUrl, price, weeks, learningOutcomes,
        coachingEnabled, coachingHourlyRate, discordEnabled, discordDescription,
        weeklyWorkshop: { enabled: workshopEnabled, dayOfWeek: workshopDay, time: workshopTime, description: workshopDesc },
      }),
    })
    if (res.ok) setSaveStatus('saved')
  }

  useEffect(() => {
    if (loading) return
    scheduleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, coverImageUrl, price, weeks, learningOutcomes, coachingEnabled, coachingHourlyRate, discordEnabled, discordDescription, workshopEnabled, workshopDay, workshopTime, workshopDesc])

  const uploadFile = async (file: File, setter: (url: string) => void, loadingSetter: (b: boolean) => void) => {
    loadingSetter(true)
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setter(data.url)
    } finally { loadingSetter(false) }
  }

  const addWeek = () => {
    const newWeek: Week = {
      weekNumber: weeks.length + 1, title: `Week ${weeks.length + 1}`,
      pages: [{ title: 'Page 1', content: '', links: [] }],
      exam: { durationMinutes: 20, questions: [] },
    }
    setWeeks([...weeks, newWeek])
    setSelectedWeek(weeks.length)
    setSelectedPage(0)
  }

  const removeWeek = (idx: number) => {
    if (!confirm('Delete this week? This cannot be undone.')) return
    const next = weeks.filter((_, i) => i !== idx).map((w, i) => ({ ...w, weekNumber: i + 1 }))
    setWeeks(next)
    setSelectedWeek(null)
  }

  const updateWeek = (idx: number, field: string, value: any) => {
    const next = [...weeks]
    ;(next[idx] as any)[field] = value
    setWeeks(next)
  }

  const addPage = (weekIdx: number) => {
    const next = [...weeks]
    next[weekIdx].pages.push({ title: `Page ${next[weekIdx].pages.length + 1}`, content: '', links: [] })
    setWeeks(next)
    setSelectedPage(next[weekIdx].pages.length - 1)
  }

  const removePage = (weekIdx: number, pageIdx: number) => {
    if (weeks[weekIdx].pages.length <= 1) { alert('A week needs at least one page.'); return }
    if (!confirm('Delete this page?')) return
    const next = [...weeks]
    next[weekIdx].pages = next[weekIdx].pages.filter((_, i) => i !== pageIdx)
    setWeeks(next)
    setSelectedPage(Math.max(0, pageIdx - 1))
  }

  const updatePage = (weekIdx: number, pageIdx: number, field: string, value: any) => {
    const next = [...weeks]
    ;(next[weekIdx].pages[pageIdx] as any)[field] = value
    setWeeks(next)
  }

  const addOutcome = () => {
    if (!newOutcome.trim()) return
    setLearningOutcomes([...learningOutcomes, newOutcome.trim()])
    setNewOutcome('')
  }

  const removeOutcome = (i: number) => setLearningOutcomes(learningOutcomes.filter((_, idx) => idx !== i))

  const bulkUploadQuestions = async (file: File, mode: 'append' | 'replace') => {
    if (selectedWeek === null) return
    setBulkUploading(true)
    setBulkResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)
      const res = await fetch(`/api/tutor/self-paced-courses/${courseId}/weeks/${selectedWeek}/bulk-upload-questions`, { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setBulkResult(`Imported ${data.imported} question(s)${data.skipped > 0 ? `, skipped ${data.skipped} row(s) with errors` : ''}.`)
        const refreshed = await fetch(`/api/tutor/self-paced-courses/${courseId}`).then((r) => r.json())
        setWeeks(refreshed.course.weeks)
      } else {
        setBulkResult(`Failed: ${data.error}`)
      }
    } finally {
      setBulkUploading(false)
    }
  }

  const publish = async (desired: string) => {
    await doSave()
    const res = await fetch(`/api/tutor/self-paced-courses/${courseId}/publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: desired }),
    })
    const data = await res.json()
    if (res.ok) setStatus(data.status)
    else alert(data.error)
  }

  const deleteCourse = async () => {
    if (!confirm('Delete this course permanently? This cannot be undone.')) return
    const res = await fetch(`/api/tutor/self-paced-courses/${courseId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) router.push('/dashboard/tutor/self-paced')
    else alert(data.error)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const week = selectedWeek !== null ? weeks[selectedWeek] : null
  const page = week ? week.pages[selectedPage] : null
  const locked = status === 'published'

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <Link href="/dashboard/tutor/self-paced" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"><ArrowLeft size={18} /></Link>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} className="flex-1 min-w-[140px] font-bold text-gray-900 text-base outline-none disabled:bg-transparent" placeholder="Course title" />
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status === 'published' ? 'bg-green-100 text-green-700' : status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{status.replace('_', ' ')}</span>
          {!locked && (
            <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
              {saveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving...</>}
              {saveStatus === 'saved' && <><Save size={12} /> Saved</>}
            </span>
          )}
          <Link href={`/dashboard/tutor/self-paced/${courseId}/students`} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"><Users size={15} /> Students</Link>
          <Link href={`/dashboard/tutor/self-paced/${courseId}/availability`} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"><Calendar size={15} /> Availability</Link>

          {status === 'draft' && (
            <>
              <button onClick={() => publish('pending_approval')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shrink-0"><Eye size={15} /> Submit for Review</button>
              <button onClick={deleteCourse} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0"><Trash2 size={15} /> Delete</button>
            </>
          )}
          {status === 'pending_approval' && <span className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-semibold shrink-0">Pending Admin Review</span>}
          {status === 'published' && (
            <>
              <button onClick={() => publish('draft')} className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-semibold shrink-0"><EyeOff size={15} /> Unpublish to Edit</button>
              <button onClick={deleteCourse} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0"><Trash2 size={15} /> Delete</button>
            </>
          )}
          {status === 'rejected' && (
            <>
              <button onClick={() => publish('pending_approval')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shrink-0"><Eye size={15} /> Resubmit for Review</button>
              <button onClick={deleteCourse} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0"><Trash2 size={15} /> Delete</button>
            </>
          )}
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-4 border-t border-gray-50">
          {(['content', 'settings'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`py-2.5 text-sm font-semibold capitalize border-b-2 ${activeTab === t ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent'}`}>{t}</button>
          ))}
        </div>
      </div>

      {locked && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-600 shrink-0" />
            <p className="text-xs text-orange-700">This course is <strong>published and live</strong> — it cannot be edited. Click <strong>"Unpublish to Edit"</strong> above, make your changes, then submit for review again.</p>
          </div>
        </div>
      )}

      <fieldset disabled={locked} className={locked ? 'opacity-60 pointer-events-none' : ''}>
        {activeTab === 'content' && (
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
            {/* Weeks sidebar */}
            <div className="w-full lg:w-64 shrink-0 border-r border-gray-100 p-4 space-y-1">
              <button onClick={addWeek} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 mb-2"><Plus size={14} /> Add Week</button>
              {weeks.map((w, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer group ${selectedWeek === i ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <span onClick={() => { setSelectedWeek(i); setSelectedPage(0) }} className="flex-1 text-sm font-medium truncate">Week {w.weekNumber}: {w.title} <span className="text-[10px] text-gray-400">({w.pages.length}p)</span></span>
                  <button onClick={() => removeWeek(i)} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={13} /></button>
                </div>
              ))}
              {weeks.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Add your first week to get started.</p>}
            </div>

            {/* Editor panel */}
            <div className="flex-1 min-w-0 p-4 sm:p-6">
              {!week ? (
                <p className="text-gray-400 text-sm text-center py-16">Select or add a week to start editing.</p>
              ) : (
                <div className="max-w-3xl space-y-5">
                  <input value={week.title} onChange={(e) => updateWeek(selectedWeek!, 'title', e.target.value)} className="w-full text-xl font-bold text-gray-900 outline-none border-b border-transparent focus:border-gray-200 pb-2" placeholder="Week title" />

                  {/* Page tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap border-b border-gray-100 pb-3">
                    {week.pages.map((p, pi) => (
                      <button key={pi} onClick={() => setSelectedPage(pi)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedPage === pi ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        Page {pi + 1}
                      </button>
                    ))}
                    <button onClick={() => addPage(selectedWeek!)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold"><Plus size={12} /> Add Page</button>
                    {week.pages.length > 1 && (
                      <button onClick={() => removePage(selectedWeek!, selectedPage)} className="flex items-center gap-1 px-3 py-1.5 text-red-500 rounded-lg text-xs font-semibold"><Trash2 size={12} /> Remove Page</button>
                    )}
                  </div>

                  {page && (
                    <>
                      <input value={page.title} onChange={(e) => updatePage(selectedWeek!, selectedPage, 'title', e.target.value)} className="w-full text-sm font-semibold text-gray-800 outline-none border-b border-transparent focus:border-gray-200 pb-1.5" placeholder="Page title" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content</p>
                        <RichTextEditor resetKey={`week-${selectedWeek}-page-${selectedPage}`} value={page.content} onChange={(html) => updatePage(selectedWeek!, selectedPage, 'content', html)} placeholder="Write this page's lesson — add images and links inline..." />
                      </div>
                      <LinkEditor links={page.links} onChange={(links) => updatePage(selectedWeek!, selectedPage, 'links', links)} />
                    </>
                  )}

                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Week Exam <span className="normal-case text-gray-400">(appears after the last page of this week)</span></p>
                    </div>
                    <input type="number" min={1} value={week.exam.durationMinutes} onChange={(e) => updateWeek(selectedWeek!, 'exam', { ...week.exam, durationMinutes: Number(e.target.value) })} className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <span className="text-xs text-gray-400 ml-2">minutes · 3 attempts, then locks until tutor unlocks</span>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 mt-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bulk Upload Questions (Excel)</p>
                        <a href="/api/tutor/self-paced-courses/any/weeks/0/bulk-upload-questions" className="text-xs font-semibold text-blue-600 hover:underline">Download Template</a>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <label className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100">
                          {bulkUploading ? 'Uploading...' : 'Add to Existing'}
                          <input type="file" accept=".xlsx,.xls" className="hidden" disabled={bulkUploading} onChange={(e) => e.target.files?.[0] && bulkUploadQuestions(e.target.files[0], 'append')} />
                        </label>
                        <label className="px-3 py-2 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 cursor-pointer hover:bg-red-50">
                          Replace All Questions
                          <input type="file" accept=".xlsx,.xls" className="hidden" disabled={bulkUploading} onChange={(e) => e.target.files?.[0] && bulkUploadQuestions(e.target.files[0], 'replace')} />
                        </label>
                      </div>
                      {bulkResult && <p className="text-xs text-gray-600">{bulkResult}</p>}
                    </div>

                    <div className="mt-4">
                      <QuestionEditor questions={week.exam.questions as any} onChange={(questions) => updateWeek(selectedWeek!, 'exam', { ...week.exam, questions })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cover & Pricing</p>
              <div className="flex items-center gap-4 mb-4">
                {coverImageUrl ? <img src={coverImageUrl} className="w-24 h-16 rounded-lg object-cover" /> : <div className="w-24 h-16 rounded-lg bg-gray-100 flex items-center justify-center"><Upload size={18} className="text-gray-300" /></div>}
                <label className="text-xs font-semibold text-blue-600 cursor-pointer">
                  {uploading ? 'Uploading...' : 'Upload Cover Image'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setCoverImageUrl, setUploading)} />
                </label>
              </div>
              <label className="text-xs text-gray-500 mb-1 block">Price (₦, 0 = free)</label>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Course description" className="w-full mt-3 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            {/* Learning Outcomes Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Certificate Learning Outcomes</p>
              <p className="text-xs text-gray-400 mb-3">These appear on the certificate students receive when they complete this course.</p>
              <div className="space-y-1.5 mb-2">
                {learningOutcomes.map((o, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <span className="flex-1">{o}</span>
                    <button onClick={() => removeOutcome(i)}><X size={13} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOutcome()} placeholder="e.g. Develop full stack web applications" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
                <button onClick={addOutcome} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold shrink-0">Add</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3"><input type="checkbox" checked={coachingEnabled} onChange={(e) => setCoachingEnabled(e.target.checked)} /> Offer 1-on-1 Coaching</label>
              {coachingEnabled && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hourly rate (₦)</label>
                  <input type="number" min={0} value={coachingHourlyRate} onChange={(e) => setCoachingHourlyRate(Number(e.target.value))} className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3"><input type="checkbox" checked={discordEnabled} onChange={(e) => setDiscordEnabled(e.target.checked)} /> Show Discord Community Link</label>
              {discordEnabled && <textarea value={discordDescription} onChange={(e) => setDiscordDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3"><input type="checkbox" checked={workshopEnabled} onChange={(e) => setWorkshopEnabled(e.target.checked)} /> Weekly Free Workshop (optional)</label>
              {workshopEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <input value={workshopDay} onChange={(e) => setWorkshopDay(e.target.value)} placeholder="Day" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <input value={workshopTime} onChange={(e) => setWorkshopTime(e.target.value)} placeholder="Time" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <textarea value={workshopDesc} onChange={(e) => setWorkshopDesc(e.target.value)} placeholder="Description" rows={2} className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>
          </div>
        )}
      </fieldset>
    </div>
  )
}