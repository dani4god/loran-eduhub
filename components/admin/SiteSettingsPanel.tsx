// components/admin/SiteSettingsPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Image as ImageIcon, Upload, AlertTriangle, Loader2, X, Plus, FileSignature } from 'lucide-react'

export default function SiteSettingsPanel() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [heroImages, setHeroImages] = useState<string[]>([])
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [loading, setLoading] = useState(true)
  const [certSignature, setCertSignature] = useState<string | null>(null)
  const [certLogo, setCertLogo] = useState<string | null>(null)
  const [uploadingCertSig, setUploadingCertSig] = useState(false)
  const [uploadingCertLogo, setUploadingCertLogo] = useState(false)

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((d) => { 
        setLogoUrl(d.logoUrl)
        setMaintenanceMode(d.maintenanceMode)
        setHeroImages(d.heroImageUrls || [])
        setCertSignature(d.certificateSignatureUrl || null)
        setCertLogo(d.certificateLogoUrl || null)
      })
      .finally(() => setLoading(false))
  }, [])

  const uploadLogo = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const patchRes = await fetch('/api/admin/settings/site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: data.url }),
      })
      const patchData = await patchRes.json()
      setLogoUrl(patchData.logoUrl)
      toast.success('Logo updated')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const uploadHeroImage = async (file: File) => {
    setUploadingHero(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const next = [...heroImages, data.url]
      setHeroImages(next)
      await fetch('/api/admin/settings/site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroImageUrls: next }),
      })
      toast.success('Hero image added')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingHero(false)
    }
  }

  const removeHeroImage = async (url: string) => {
    const next = heroImages.filter((u) => u !== url)
    setHeroImages(next)
    await fetch('/api/admin/settings/site', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heroImageUrls: next }),
    })
    toast.success('Hero image removed')
  }

  const uploadCertAsset = async (file: File, field: 'sig' | 'logo') => {
    field === 'sig' ? setUploadingCertSig(true) : setUploadingCertLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        const patch = field === 'sig' 
          ? { certificateSignatureUrl: data.url } 
          : { certificateLogoUrl: data.url }
        field === 'sig' ? setCertSignature(data.url) : setCertLogo(data.url)
        await fetch('/api/admin/settings/site', { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(patch) 
        })
        toast.success(field === 'sig' ? 'Signature uploaded' : 'Logo uploaded')
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      field === 'sig' ? setUploadingCertSig(false) : setUploadingCertLogo(false)
    }
  }

  const toggleMaintenance = async () => {
    const next = !maintenanceMode
    if (next && !confirm('This will block all students and tutors from accessing the site until you turn it off. Continue?')) return
    const res = await fetch('/api/admin/settings/site', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maintenanceMode: next }),
    })
    if (res.ok) { 
      setMaintenanceMode(next)
      toast.success(next ? 'Maintenance mode enabled' : 'Maintenance mode disabled')
    } else {
      toast.error('Failed to update')
    }
  }

  if (loading) return null

  return (
    <div className="space-y-4">
      {/* Logo Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={18} className="text-red-600" />
          <h2 className="text-base font-semibold text-gray-900">Site Logo</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Appears in the navbar and footer across the whole site.</p>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-white font-bold">L</span>}
          </div>
          <label className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload New Logo'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* Hero Images Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">Landing Page Hero Images</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Displayed as the full hero section background on the homepage. Multiple images rotate as a slideshow.
        </p>

        {/* Hero Images Grid */}
        {heroImages.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {heroImages.map((url) => (
              <div key={url} className="relative w-20 h-14 group">
                <img src={url} alt="Hero" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                <button
                  onClick={() => removeHeroImage(url)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={11} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-3">No hero images uploaded yet.</p>
        )}

        {/* Upload Button */}
        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
          {uploadingHero ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {uploadingHero ? 'Uploading...' : 'Add Hero Image'}
          <input type="file" accept="image/*" className="hidden" disabled={uploadingHero} onChange={(e) => e.target.files?.[0] && uploadHeroImage(e.target.files[0])} />
        </label>
      </div>

      {/* Self-Paced Course Certificate Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">Self-Paced Course Certificate</p>
        <p className="text-xs text-gray-500 mb-4">
          Applies to every self-paced course certificate platform-wide. Signed as <strong>Okeke Daniel, Academic Director</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Signature</p>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
              {certSignature ? <img src={certSignature} className="h-12 mx-auto object-contain mb-1.5" /> : <div className="h-12" />}
              <label className="text-xs font-semibold text-blue-600 cursor-pointer">
                {uploadingCertSig ? 'Uploading...' : certSignature ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingCertSig} onChange={(e) => e.target.files?.[0] && uploadCertAsset(e.target.files[0], 'sig')} />
              </label>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Logo / Seal</p>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
              {certLogo ? <img src={certLogo} className="h-12 mx-auto object-contain mb-1.5" /> : <div className="h-12" />}
              <label className="text-xs font-semibold text-blue-600 cursor-pointer">
                {uploadingCertLogo ? 'Uploading...' : certLogo ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingCertLogo} onChange={(e) => e.target.files?.[0] && uploadCertAsset(e.target.files[0], 'logo')} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Section */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={18} className="text-orange-600" />
          <h2 className="text-base font-semibold text-gray-900">Maintenance Mode</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Blocks all student and tutor access site-wide and shows a maintenance page. Admin access is unaffected.
        </p>
        <button
          onClick={toggleMaintenance}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            maintenanceMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
        </button>
        {maintenanceMode && (
          <p className="text-xs text-orange-600 font-semibold mt-2">⚠ Maintenance mode is currently ON.</p>
        )}
      </div>
    </div>
  )
}