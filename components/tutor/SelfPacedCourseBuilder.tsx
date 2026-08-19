// components/tutor/SelfPacedCourseBuilder.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Upload, Loader2, Eye, EyeOff, Save, Users,
  Calendar, MessageSquare, DollarSign, ChevronDown, ChevronRight, X, PenTool,
  Download, AlertTriangle,
} from 'lucide-react'
import RichTextEditor from '@/components/library/RichTextEditor'
import QuestionEditor from '@/components/library/QuestionEditor'
import LinkEditor from '@/components/library/LinkEditor'

interface Question { type: string; question: string; options?: string[]; correctAnswer: string; marks: number }
interface Week { _id?: string; weekNumber: number; title: string; content: string; links: any[]; exam: { durationMinutes: number; questions: Question[] } }

export default function SelfPacedCourseBuilder({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('draft')
  const [weeks, setWeeks] = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)

  const [coachingEnabled, setCoachingEnabled] = useState(false)
  const [coachingHourlyRate, setCoachingHourlyRate] = useState(0)
  const [discordEnabled, setDiscordEnabled] = useState(true)
  const [discordDescription, setDiscordDescription] = useState('')
  const [workshopEnabled, setWorkshopEnabled] = useState(false)
  const [workshopDay, setWorkshopDay] = useState('')
  const [workshopTime, setWorkshopTime] = useState('')
  const [workshopDesc, setWorkshopDesc] = useState('')
  const [certSignature, setCertSignature] = useState<string | null>(null)
  const [certLogo, setCertLogo] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<string | null>(null)
  const saveTimer = useRef<any>(null)

  useEffect(() => {
    fetch(`/api/tutor/self-paced-courses/${courseId}`).then((r) => r.json()).then((d) => {
      const c = d.course
      setTitle(c.title); setDescription(c.description || ''); setCoverImageUrl(c.coverImageUrl);
      setPrice(c.price); setCategory(c.category || ''); setStatus(c.status);
      setWeeks(c.weeks.length ? c.weeks : []);
      setCoachingEnabled(c.coachingEnabled); setCoachingHourlyRate(c.coachingHourlyRate);
      setDiscordEnabled(c.discordEnabled); setDiscordDescription(c.discordDescription || '');
      setWorkshopEnabled(c.weeklyWorkshop?.enabled || false);
      setWorkshopDay(c.weeklyWorkshop?.dayOfWeek || ''); setWorkshopTime(c.weeklyWorkshop?.time || '');
      setWorkshopDesc(c.weeklyWorkshop?.description || '');
      setCertSignature(c.certificateSignatureUrl || null); setCertLogo(c.certificateLogoUrl || null);
    }).finally(() => setLoading(false))
  }, [courseId])

  // Autosave — debounced 1.2s after any change.
  const scheduleSave = () => {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 1200)
  }

  const doSave = async () => {
    await fetch(`/api/tutor/self-paced-courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, coverImageUrl, price, category, weeks,
        coachingEnabled, coachingHourlyRate, discordEnabled, discordDescription,
        weeklyWorkshop: { enabled: workshopEnabled, dayOfWeek: workshopDay, time: workshopTime, description: workshopDesc },
        certificateSignatureUrl: certSignature, certificateLogoUrl: certLogo,
      }),
    })
    setSaveStatus('saved')
  }

  useEffect(() => {
    if (loading) return
    scheduleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, coverImageUrl, price, category, weeks, coachingEnabled, coachingHourlyRate, discordEnabled, discordDescription, workshopEnabled, workshopDay, workshopTime, workshopDesc, certSignature, certLogo])

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
    const newWeek: Week = { weekNumber: weeks.length + 1, title: `Week ${weeks.length + 1}`, content: '', links: [], exam: { durationMinutes: 20, questions: [] } }
    setWeeks([...weeks, newWeek])
    setSelectedWeek(weeks.length)
  }

  const removeWeek = (idx: number) => {
    if (!confirm('Delete this week? Students who already progressed past it keep their record, but the content will be gone.')) return
    const next = weeks.filter((_, i) => i !== idx).map((w, i) => ({ ...w, weekNumber: i + 1 }))
    setWeeks(next)
    setSelectedWeek(null)
  }

  const updateWeek = (idx: number, field: string, value: any) => {
    const next = [...weeks]
    ;(next[idx] as any)[field] = value
    setWeeks(next)
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

  const bulkUploadQuestions = async (file: File, mode: 'append' | 'replace') => {
    if (selectedWeek === null) return
    setBulkUploading(true)
    setBulkResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)
      const res = await fetch(`/api/tutor/self-paced-courses/${courseId}/weeks/${selectedWeek}/bulk-upload-questions`, {
        method: 'POST', body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setBulkResult(`Imported ${data.imported} question(s)${data.skipped > 0 ? `, skipped ${data.skipped} row(s) with errors` : ''}.`)
        // refetch the course so the newly-added questions show up in the editor
        const refreshed = await fetch(`/api/tutor/self-paced-courses/${courseId}`).then((r) => r.json())
        setWeeks(refreshed.course.weeks)
      } else {
        setBulkResult(`Failed: ${data.error}`)
      }
    } catch (error) {
      setBulkResult('Failed to upload file')
    } finally {
      setBulkUploading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const week = selectedWeek !== null ? weeks[selectedWeek] : null

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <Link href="/dashboard/tutor/self-paced" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"><ArrowLeft size={18} /></Link>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="flex-1 min-w-[140px] font-bold text-gray-900 text-base outline-none" 
            placeholder="Course title" 
            disabled={status === 'published'}
          />
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status === 'published' ? 'bg-green-100 text-green-700' : status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
            {status === 'pending_approval' ? 'Pending Review' : status}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
            {saveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving...</>}
            {saveStatus === 'saved' && <><Save size={12} /> Saved</>}
          </span>
          <Link href={`/dashboard/tutor/self-paced/${courseId}/students`} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">
            <Users size={15} /> Students
          </Link>
          <Link href={`/dashboard/tutor/self-paced/${courseId}/availability`} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">
            <Calendar size={15} /> Availability
          </Link>
          
          {/* Status-based action buttons */}
          {status === 'draft' && (
            <>
              <button onClick={() => publish('pending_approval')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shrink-0">
                <Eye size={15} /> Submit for Review
              </button>
              <button onClick={deleteCourse} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0">
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}

          {status === 'pending_approval' && (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-semibold shrink-0">Pending Admin Review</span>
          )}

          {status === 'published' && (
            <>
              <button onClick={() => publish('draft')} className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-semibold shrink-0">
                <EyeOff size={15} /> Unpublish to Edit
              </button>
              <button onClick={deleteCourse} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0">
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}

          {status === 'rejected' && (
            <>
              <button onClick={() => publish('pending_approval')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shrink-0">
                <Eye size={15} /> Resubmit for Review
              </button>
              <button onClick={deleteCourse} className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold shrink-0">
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-4 border-t border-gray-50">
          {(['content', 'settings'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`py-2.5 text-sm font-semibold capitalize border-b-2 ${activeTab === t ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Editing lock banner */}
      {status === 'published' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-600 shrink-0" />
            <p className="text-xs text-orange-700">
              This course is <strong>published and live</strong> — it cannot be edited. Click <strong>"Unpublish to Edit"</strong> above, make your changes, then submit for review again before it goes back live.
            </p>
          </div>
        </div>
      )}

      {/* Tab content with disabled state for published courses */}
      <fieldset disabled={status === 'published'} className={status === 'published' ? 'opacity-60 pointer-events-none' : ''}>
        {activeTab === 'content' && (
          <div className="max-w-6xl mx-auto flex">
            {/* Weeks sidebar */}
            <div className="w-full lg:w-72 shrink-0 border-r border-gray-100 p-4 space-y-1">
              <button onClick={addWeek} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 mb-2">
                <Plus size={14} /> Add Week
              </button>
              {weeks.map((w, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer group ${selectedWeek === i ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <span onClick={() => setSelectedWeek(i)} className="flex-1 text-sm font-medium truncate">Week {w.weekNumber}: {w.title}</span>
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
                  <input 
                    value={week.title} 
                    onChange={(e) => updateWeek(selectedWeek!, 'title', e.target.value)} 
                    className="w-full text-xl font-bold text-gray-900 outline-none border-b border-transparent focus:border-gray-200 pb-2" 
                    placeholder="Week title" 
                  />

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content</p>
                    <RichTextEditor resetKey={`week-${selectedWeek}`} value={week.content} onChange={(html) => updateWeek(selectedWeek!, 'content', html)} placeholder="Write this week's lesson — add images and links inline..." />
                  </div>

                  <LinkEditor links={week.links} onChange={(links) => updateWeek(selectedWeek!, 'links', links)} />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Exam Duration</p>
                    </div>
                    <input
                      type="number" min={1} value={week.exam.durationMinutes}
                      onChange={(e) => updateWeek(selectedWeek!, 'exam', { ...week.exam, durationMinutes: Number(e.target.value) })}
                      className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <span className="text-xs text-gray-400 ml-2">minutes · students get 3 attempts, then the course locks until you unlock it</span>
                  </div>

                  {/* Bulk Upload UI */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bulk Upload Questions (Excel)</p>
                      <a 
                        href={`/api/tutor/self-paced-courses/${courseId}/weeks/${selectedWeek}/bulk-upload-questions`} 
                        className="text-xs font-semibold text-blue-600 hover:underline"
                        target="_blank"
                      >
                        <Download size={12} className="inline mr-1" />
                        Download Template
                      </a>
                    </div>
                    <p className="text-xs text-gray-500">
                      <strong>Column headers must match exactly:</strong> Type, Question, Option1, Option2, Option3, Option4, CorrectAnswer, Marks
                    </p>
                    <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                      <li><strong>Type</strong> — MCQ, TrueFalse, or Fill</li>
                      <li><strong>Question</strong> — the question text</li>
                      <li><strong>Option1–Option4</strong> — only for MCQ, leave blank for other types</li>
                      <li><strong>CorrectAnswer</strong> — the exact correct answer (for MCQ, must match one of the options exactly)</li>
                      <li><strong>Marks</strong> — optional, defaults to 1</li>
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <label className={`px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 ${bulkUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {bulkUploading ? 'Uploading...' : 'Add to Existing'}
                        <input 
                          type="file" 
                          accept=".xlsx,.xls,.csv" 
                          className="hidden" 
                          disabled={bulkUploading} 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              bulkUploadQuestions(e.target.files[0], 'append')
                            }
                            e.target.value = '' // Reset input
                          }} 
                        />
                      </label>
                      <label className={`px-3 py-2 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 cursor-pointer hover:bg-red-50 ${bulkUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Replace All Questions
                        <input 
                          type="file" 
                          accept=".xlsx,.xls,.csv" 
                          className="hidden" 
                          disabled={bulkUploading} 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              bulkUploadQuestions(e.target.files[0], 'replace')
                            }
                            e.target.value = '' // Reset input
                          }} 
                        />
                      </label>
                    </div>
                    {bulkResult && <p className={`text-xs ${bulkResult.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{bulkResult}</p>}
                  </div>

                  <QuestionEditor
                    questions={week.exam.questions as any}
                    onChange={(questions) => updateWeek(selectedWeek!, 'exam', { ...week.exam, questions })}
                  />
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
                <label className={`text-xs font-semibold text-blue-600 cursor-pointer ${status === 'published' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploading ? 'Uploading...' : 'Upload Cover Image'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading || status === 'published'} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setCoverImageUrl, setUploading)} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Price (₦, 0 = free)</label>
                  <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Category</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
                </div>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Course description (shown on public page)" className="w-full mt-3 border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className={`flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3 ${status === 'published' ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="checkbox" checked={coachingEnabled} onChange={(e) => setCoachingEnabled(e.target.checked)} disabled={status === 'published'} /> Offer 1-on-1 Coaching
              </label>
              {coachingEnabled && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hourly rate (₦)</label>
                  <input type="number" min={0} value={coachingHourlyRate} onChange={(e) => setCoachingHourlyRate(Number(e.target.value))} className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
                  <p className="text-[11px] text-gray-400 mt-1">Set your available slots from the Availability page.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className={`flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3 ${status === 'published' ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="checkbox" checked={discordEnabled} onChange={(e) => setDiscordEnabled(e.target.checked)} disabled={status === 'published'} /> Show Discord Community Link
              </label>
              {discordEnabled && (
                <textarea value={discordDescription} onChange={(e) => setDiscordDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className={`flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3 ${status === 'published' ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="checkbox" checked={workshopEnabled} onChange={(e) => setWorkshopEnabled(e.target.checked)} disabled={status === 'published'} /> Weekly Free Workshop (optional)
              </label>
              {workshopEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <input value={workshopDay} onChange={(e) => setWorkshopDay(e.target.value)} placeholder="Day (e.g. Saturday)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
                  <input value={workshopTime} onChange={(e) => setWorkshopTime(e.target.value)} placeholder="Time (e.g. 4:00 PM)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
                  <textarea value={workshopDesc} onChange={(e) => setWorkshopDesc(e.target.value)} placeholder="Description" rows={2} className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={status === 'published'} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><PenTool size={12} /> Certificate Assets</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                  {certSignature ? <img src={certSignature} className="h-10 mx-auto object-contain mb-1.5" /> : <Upload size={16} className="text-gray-300 mx-auto mb-1.5" />}
                  <label className={`text-xs font-semibold text-blue-600 cursor-pointer ${status === 'published' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingSig ? 'Uploading...' : 'Signature'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingSig || status === 'published'} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setCertSignature, setUploadingSig)} />
                  </label>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                  {certLogo ? <img src={certLogo} className="h-10 mx-auto object-contain mb-1.5" /> : <Upload size={16} className="text-gray-300 mx-auto mb-1.5" />}
                  <label className={`text-xs font-semibold text-blue-600 cursor-pointer ${status === 'published' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingLogo ? 'Uploading...' : 'Logo'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo || status === 'published'} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setCertLogo, setUploadingLogo)} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  )
}