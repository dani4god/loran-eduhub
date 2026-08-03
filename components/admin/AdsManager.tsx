// components/admin/AdsManager.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Megaphone, Plus, Trash2, Upload, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface Ad {
  _id: string
  title: string
  message: string
  imageUrl: string | null
  linkUrl: string | null
  linkLabel: string
  isActive: boolean
  createdAt: string
}

export default function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('Learn More')

  const load = () => {
    setLoading(true)
    fetch('/api/admin/ads').then((r) => r.json()).then((d) => setAds(d.ads || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setImageUrl(data.url)
      else toast.error(data.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setTitle(''); setMessage(''); setImageUrl(null); setLinkUrl(''); setLinkLabel('Learn More'); setShowForm(false)
  }

  const create = async () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, imageUrl, linkUrl, linkLabel }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Ad created'); resetForm(); load() }
      else toast.error(data.error || 'Failed to create ad')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (ad: Ad) => {
    const res = await fetch(`/api/admin/ads/${ad._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !ad.isActive }),
    })
    if (res.ok) { load() } else toast.error('Failed to update ad')
  }

  const remove = async (ad: Ad) => {
    if (!confirm(`Delete the ad "${ad.title}"?`)) return
    const res = await fetch(`/api/admin/ads/${ad._id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Ad deleted'); load() } else toast.error('Failed to delete')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Megaphone size={18} className="text-red-600" />
          <h2 className="text-base font-semibold text-gray-900">Homepage Ads</h2>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
            <Plus size={13} /> New Ad
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">Shown as a floating card in the corner of the homepage.</p>

      {showForm && (
        <div className="border-2 border-red-100 rounded-xl p-4 space-y-3 mb-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ad title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Short message" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />

          <div className="flex items-center gap-3">
            {imageUrl && <img src={imageUrl} alt="Ad" className="w-16 h-16 rounded-lg object-cover" />}
            <label className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Upload Image (optional)'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Link URL (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Button label" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="flex gap-2">
            <button onClick={resetForm} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
            <button onClick={create} disabled={creating} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
              {creating && <Loader2 size={14} className="animate-spin" />} Create Ad
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center"><div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : ads.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No ads created yet.</p>
      ) : (
        <div className="space-y-2.5">
          {ads.map((ad) => (
            <div key={ad._id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
              {ad.imageUrl ? (
                <img src={ad.imageUrl} alt={ad.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Megaphone size={16} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{ad.title}</p>
                <p className="text-xs text-gray-400 truncate">{ad.message}</p>
                {ad.linkUrl && (
                  <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                    <ExternalLink size={10} /> {ad.linkUrl}
                  </a>
                )}
              </div>
              <button onClick={() => toggleActive(ad)} className={`p-2 rounded-lg shrink-0 ${ad.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={ad.isActive ? 'Live' : 'Hidden'}>
                {ad.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={() => remove(ad)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}