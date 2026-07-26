// components/tutor/ProfileSettings.tsx
'use client'

import { useEffect, useState } from 'react'
import { User, Loader2, CheckCircle, Upload } from 'lucide-react'

export default function ProfileSettings() {
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tutor/profile')
      .then((r) => r.json())
      .then((d) => {
        setBio(d.tutor?.bio || '')
        setProfileImage(d.tutor?.profileImage || null)
        setPhone(d.tutor?.phone || '')
      })
      .finally(() => setLoading(false))
  }, [])

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setProfileImage(data.url)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      const res = await fetch('/api/tutor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, profileImage, phone }),
      })
      const data = await res.json()
      if (res.ok) setSuccess(true)
      else setError(data.error || 'Failed to save')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <User size={18} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Update your public profile shown to prospective students.
      </p>

      <div className="flex items-center gap-4 mb-5">
        {profileImage ? (
          <img src={profileImage} alt="Profile" className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <User size={24} className="text-blue-500" />
          </div>
        )}
        <label className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? 'Uploading...' : 'Change Photo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
          />
        </label>
      </div>

      <div className="space-y-3 max-w-lg">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
            Phone
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">{bio.length}/500 characters (min 50)</p>
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {success && (
          <p className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
            <CheckCircle size={13} /> Saved
          </p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Profile
        </button>
      </div>
    </div>
  )
}