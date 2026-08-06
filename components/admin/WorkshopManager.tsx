// components/admin/WorkshopManager.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Calendar, Plus, X, Upload, Loader2, Trash2, Copy, ShieldCheck,
  Eye, EyeOff, Image as ImageIcon,
} from 'lucide-react'

interface Speaker { _id?: string; name: string; sessionTitle: string; description: string; points: string[] }
interface CertBatch {
  _id: string; title: string; code: string; themeImageUrl: string; logoUrl: string;
  isActive: boolean; issuedCount: number; createdAt: string
}

export default function WorkshopManager() {
  const [heading, setHeading] = useState('')
  const [subheading, setSubheading] = useState('')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [advertImages, setAdvertImages] = useState<string[]>([])
  const [discordLink, setDiscordLink] = useState('')
  const [uploadingAd, setUploadingAd] = useState(false)
  const [savingContent, setSavingContent] = useState(false)
  const [loading, setLoading] = useState(true)

  const [batches, setBatches] = useState<CertBatch[]>([])
  const [showCertForm, setShowCertForm] = useState(false)
  const [certTitle, setCertTitle] = useState('')
  const [themeImageUrl, setThemeImageUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingTheme, setUploadingTheme] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [creatingBatch, setCreatingBatch] = useState(false)

  const loadContent = () => {
    fetch('/api/admin/workshop').then((r) => r.json()).then((d) => {
      setHeading(d.content.heading); setSubheading(d.content.subheading);
      setSpeakers(d.content.speakers || []); setAdvertImages(d.content.advertImages || []);
      setDiscordLink(d.content.discordInviteLink || '');
    })
  }
  const loadBatches = () => fetch('/api/admin/workshop/certificates').then((r) => r.json()).then((d) => setBatches(d.batches || []))

  useEffect(() => { Promise.all([loadContent(), loadBatches()]).finally(() => setLoading(false)) }, [])

  const updateSpeaker = (i: number, field: keyof Speaker, value: any) => {
    const next = [...speakers]; (next[i] as any)[field] = value; setSpeakers(next)
  }
  const updatePoint = (si: number, pi: number, value: string) => {
    const next = [...speakers]; next[si].points[pi] = value; setSpeakers(next)
  }
  const addPoint = (si: number) => { const next = [...speakers]; next[si].points.push(''); setSpeakers(next) }
  const removePoint = (si: number, pi: number) => { const next = [...speakers]; next[si].points.splice(pi, 1); setSpeakers(next) }
  const addSpeaker = () => setSpeakers([...speakers, { name: '', sessionTitle: '', description: '', points: [''] }])
  const removeSpeaker = (i: number) => setSpeakers(speakers.filter((_, idx) => idx !== i))

  const uploadAdImage = async (file: File) => {
    setUploadingAd(true)
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setAdvertImages([...advertImages, data.url])
      else toast.error(data.error || 'Upload failed')
    } finally { setUploadingAd(false) }
  }

  const saveContent = async () => {
    setSavingContent(true)
    try {
      const res = await fetch('/api/admin/workshop', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, subheading, speakers, advertImages, discordInviteLink: discordLink }),
      })
      if (res.ok) toast.success('Workshop page updated')
      else toast.error('Failed to save')
    } finally { setSavingContent(false) }
  }

  const uploadCertImage = async (file: File, field: 'theme' | 'logo') => {
    field === 'theme' ? setUploadingTheme(true) : setUploadingLogo(true)
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) { field === 'theme' ? setThemeImageUrl(data.url) : setLogoUrl(data.url) }
      else toast.error(data.error || 'Upload failed')
    } finally {
      field === 'theme' ? setUploadingTheme(false) : setUploadingLogo(false)
    }
  }

  const createBatch = async () => {
    if (!certTitle.trim() || !themeImageUrl || !logoUrl) {
      toast.error('Title, theme image, and logo are all required')
      return
    }
    setCreatingBatch(true)
    try {
      const res = await fetch('/api/admin/workshop/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: certTitle, themeImageUrl, logoUrl }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Code generated: ${data.batch.code}`)
        setCertTitle(''); setThemeImageUrl(null); setLogoUrl(null); setShowCertForm(false)
        loadBatches()
      } else toast.error(data.error || 'Failed to create')
    } finally { setCreatingBatch(false) }
  }

  const toggleBatch = async (b: CertBatch) => {
    await fetch(`/api/admin/workshop/certificates/${b._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !b.isActive }),
    })
    loadBatches()
  }

  const deleteBatch = async (b: CertBatch) => {
    if (!confirm(`Delete certificate batch "${b.title}"? Its code will stop working.`)) return
    await fetch(`/api/admin/workshop/certificates/${b._id}`, { method: 'DELETE' })
    loadBatches()
  }

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success('Code copied') }

  if (loading) return <div className="py-10 text-center"><div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>

  return (
    <div className="space-y-4">
      {/* Page content editor */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={18} className="text-red-600" />
          <h2 className="text-base font-semibold text-gray-900">Workshop Page Content</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Edits reflect immediately on the public /workshop page.</p>

        <div className="space-y-3">
          <input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Heading" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input value={subheading} onChange={(e) => setSubheading(e.target.value)} placeholder="Subheading / topic" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input value={discordLink} onChange={(e) => setDiscordLink(e.target.value)} placeholder="Discord invite link (e.g. https://discord.gg/...)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />

          {/* Advert images */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Advert Images</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {advertImages.map((img, i) => (
                <div key={i} className="relative w-16 h-16">
                  <img src={img} className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => setAdvertImages(advertImages.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={11} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
              {uploadingAd ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />} Add Image
              <input type="file" accept="image/*" className="hidden" disabled={uploadingAd} onChange={(e) => e.target.files?.[0] && uploadAdImage(e.target.files[0])} />
            </label>
          </div>

          {/* Speakers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Speakers</label>
              <button onClick={addSpeaker} className="flex items-center gap-1 text-xs font-semibold text-red-600"><Plus size={12} /> Add Speaker</button>
            </div>
            <div className="space-y-3">
              {speakers.map((sp, si) => (
                <div key={si} className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between gap-2">
                    <input value={sp.name} onChange={(e) => updateSpeaker(si, 'name', e.target.value)} placeholder="Speaker name" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs" />
                    <button onClick={() => removeSpeaker(si)}><X size={15} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                  <input value={sp.sessionTitle} onChange={(e) => updateSpeaker(si, 'sessionTitle', e.target.value)} placeholder="Session title" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs" />
                  <input value={sp.description} onChange={(e) => updateSpeaker(si, 'description', e.target.value)} placeholder="Description / talk title" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs" />
                  <div className="space-y-1">
                    {sp.points.map((pt, pi) => (
                      <div key={pi} className="flex gap-1.5">
                        <input value={pt} onChange={(e) => updatePoint(si, pi, e.target.value)} placeholder={`Point ${pi + 1}`} className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs" />
                        <button onClick={() => removePoint(si, pi)}><X size={13} className="text-gray-400" /></button>
                      </div>
                    ))}
                    <button onClick={() => addPoint(si)} className="text-[11px] font-semibold text-red-600 flex items-center gap-1"><Plus size={10} /> Add point</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveContent} disabled={savingContent} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
            {savingContent && <Loader2 size={14} className="animate-spin" />} Save Content
          </button>
        </div>
      </div>

      {/* Certificate batches */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-red-600" />
            <h2 className="text-base font-semibold text-gray-900">Participation Certificates</h2>
          </div>
          {!showCertForm && (
            <button onClick={() => setShowCertForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
              <Plus size={13} /> New Certificate
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">Each batch generates a unique 12-digit code to share with attendees.</p>

        {showCertForm && (
          <div className="border-2 border-red-100 rounded-xl p-4 space-y-3 mb-4">
            <input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="Workshop / event title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Certificate Theme (background)</p>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                  {themeImageUrl ? <img src={themeImageUrl} className="h-16 mx-auto object-cover rounded mb-1.5" /> : <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />}
                  <label className="text-xs font-semibold text-red-600 cursor-pointer">
                    {uploadingTheme ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingTheme} onChange={(e) => e.target.files?.[0] && uploadCertImage(e.target.files[0], 'theme')} />
                  </label>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Logo</p>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                  {logoUrl ? <img src={logoUrl} className="h-16 mx-auto object-contain mb-1.5" /> : <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />}
                  <label className="text-xs font-semibold text-red-600 cursor-pointer">
                    {uploadingLogo ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={(e) => e.target.files?.[0] && uploadCertImage(e.target.files[0], 'logo')} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowCertForm(false)} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
              <button onClick={createBatch} disabled={creatingBatch} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {creatingBatch && <Loader2 size={14} className="animate-spin" />} Generate Code
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {batches.map((b) => (
            <div key={b._id} className="border border-gray-100 rounded-xl p-3 flex items-center gap-3">
              <img src={b.themeImageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{b.title}</p>
                <button onClick={() => copyCode(b.code)} className="flex items-center gap-1.5 text-xs font-mono text-red-600 mt-0.5">
                  {b.code} <Copy size={11} />
                </button>
                <p className="text-[11px] text-gray-400 mt-0.5">{b.issuedCount} certificate{b.issuedCount !== 1 ? 's' : ''} issued</p>
              </div>
              <button onClick={() => toggleBatch(b)} className={`p-2 rounded-lg shrink-0 ${b.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                {b.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={() => deleteBatch(b)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}