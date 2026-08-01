// components/tutor/SocialCampaignSettings.tsx
'use client'

import { useEffect, useState } from 'react'
import { Share2, Plus, X, Loader2, Globe, MessageCircle, Trash2 } from 'lucide-react'

interface SocialLink { label: string; url: string }
interface CampaignMessage { _id: string; message: string; createdAt: string }

export default function SocialCampaignSettings() {
  const [links, setLinks] = useState<SocialLink[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [savingLinks, setSavingLinks] = useState(false)

  const [campaigns, setCampaigns] = useState<CampaignMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [posting, setPosting] = useState(false)
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/tutor/social')
      .then((r) => r.json())
      .then((d) => { setLinks(d.socialLinks || []); setCampaigns(d.campaignMessages || []); setSlug(d.slug || ''); })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/tutors/${slug}` : ''

  const addLink = () => {
    if (!newLabel.trim() || !newUrl.trim()) return
    setLinks([...links, { label: newLabel.trim(), url: newUrl.trim() }])
    setNewLabel(''); setNewUrl('')
  }

  const saveLinks = async () => {
    setSavingLinks(true)
    try {
      await fetch('/api/tutor/social', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks: links }),
      })
    } finally {
      setSavingLinks(false)
    }
  }

  const postCampaign = async () => {
    if (!newMessage.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/tutor/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      })
      if (res.ok) { setNewMessage(''); load() }
    } finally {
      setPosting(false)
    }
  }

  const deleteCampaign = async (id: string) => {
    await fetch(`/api/tutor/campaigns/${id}`, { method: 'DELETE' })
    load()
  }

  const shareUrl = (platform: 'twitter' | 'facebook' | 'whatsapp', message: string) => {
    const text = encodeURIComponent(`${message}\n\n${profileUrl}`)
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${text}`,
    }
    window.open(urls[platform], '_blank')
  }

  if (loading) return <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">Social Media & Campaign</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Add links to your live classes or social pages, and post updates students see on your public profile.
        </p>

        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-blue-700">Your public profile: <a href={profileUrl} target="_blank" className="font-semibold underline">{profileUrl}</a></p>
        </div>

        {/* Social links */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Links (live classes, socials, etc.)</label>
          <div className="space-y-1.5 mb-2">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <span className="font-semibold truncate">{l.label}</span>
                <span className="text-gray-400 truncate flex-1">{l.url}</span>
                <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))}><X size={14} className="text-gray-400 hover:text-red-500" /></button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. Join my live class)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
            <button onClick={addLink} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold shrink-0">Add</button>
          </div>
          <button onClick={saveLinks} disabled={savingLinks} className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
            {savingLinks && <Loader2 size={13} className="animate-spin" />} Save Links
          </button>
        </div>

        {/* Campaign messages */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Post a Campaign Message</label>
          <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={3} placeholder="Share an update — new class times, a promo, anything students should know..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
          <button onClick={postCampaign} disabled={posting || !newMessage.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
            {posting && <Loader2 size={13} className="animate-spin" />} Post to Profile
          </button>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Campaign History</h3>
          <div className="space-y-2.5">
            {campaigns.map((c) => (
              <div key={c._id} className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{c.message}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => shareUrl('twitter', c.message)} className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-100" title="Share to X/Twitter"><Share2 size={13} className="text-gray-600" /></button>
                    <button onClick={() => shareUrl('facebook', c.message)} className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-100" title="Share to Facebook"><Globe size={13} className="text-gray-600" /></button>
                    <button onClick={() => shareUrl('whatsapp', c.message)} className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-100" title="Share to WhatsApp"><MessageCircle size={13} className="text-gray-600" /></button>
                  </div>
                  <button onClick={() => deleteCampaign(c._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}