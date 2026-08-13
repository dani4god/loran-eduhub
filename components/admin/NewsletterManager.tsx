// components/admin/NewsletterManager.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Mail, Send, Upload, Loader2, Plus, X, Users, GraduationCap, Shield,
  Globe, History, ExternalLink,
} from 'lucide-react'

interface LinkItem { label: string; url: string }
interface SentNewsletter {
  _id: string; subject: string; heading: string; audience: string; recipientCount: number; sentAt: string
}

const AUDIENCES: { value: string; label: string; icon: any }[] = [
  { value: 'all', label: 'Everyone', icon: Globe },
  { value: 'students', label: 'Students', icon: Users },
  { value: 'tutors', label: 'Tutors', icon: GraduationCap },
  { value: 'admins', label: 'Admins', icon: Shield },
]

export default function NewsletterManager() {
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [audience, setAudience] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [history, setHistory] = useState<SentNewsletter[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const loadHistory = () => {
    fetch('/api/admin/newsletter').then((r) => r.json()).then((d) => setHistory(d.newsletters || [])).finally(() => setLoadingHistory(false))
  }
  useEffect(() => { loadHistory() }, [])

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

  const addLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return
    setLinks([...links, { label: linkLabel.trim(), url: linkUrl.trim() }])
    setLinkLabel(''); setLinkUrl('')
  }

  const resetForm = () => {
    setSubject(''); setHeading(''); setBody(''); setImageUrl(null); setLinks([]); setAudience('all')
  }

  const send = async () => {
    if (!subject.trim() || !heading.trim() || !body.trim()) {
      toast.error('Subject, heading, and message body are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, heading,
          bodyHtml: body.replace(/\n/g, '<br/>'),
          imageUrl, links, audience,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Sent to ${data.sent} recipient(s)${data.failed > 0 ? ` (${data.failed} failed)` : ''}`)
        resetForm()
        loadHistory()
      } else {
        toast.error(data.error || 'Failed to send newsletter')
      }
    } finally {
      setSending(false)
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={18} className="text-red-600" />
          <h2 className="text-base font-semibold text-gray-900">Send Newsletter</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Compose a promotional email and send it to any audience.</p>

        <div className="space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Newsletter heading (large title in the email)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write your newsletter message..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />

          {/* Image */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Header Image (optional)</label>
            {imageUrl && (
              <div className="relative w-full h-32 mb-2">
                <img src={imageUrl} className="w-full h-full object-cover rounded-lg" />
                <button onClick={() => setImageUrl(null)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                  <X size={13} className="text-white" />
                </button>
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Upload Image'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </label>
          </div>

          {/* Links */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Call-to-Action Links (optional)</label>
            {links.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {links.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-semibold truncate">{l.label}</span>
                    <span className="text-gray-400 truncate flex-1">{l.url}</span>
                    <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))}><X size={14} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Button label (e.g. Enroll Now)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
              <button onClick={addLink} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold shrink-0">Add</button>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Send To</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAudience(a.value)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border-2 transition-colors ${
                    audience === a.value ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <a.icon size={13} /> {a.label}
                </button>
              ))}
            </div>
          </div>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={!subject.trim() || !heading.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              <Send size={15} /> Review & Send
            </button>
          ) : (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
              <p className="text-sm text-orange-800">
                This will send an email to <strong>all active {AUDIENCES.find((a) => a.value === audience)?.label.toLowerCase()}</strong>. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirming(false)} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
                <button onClick={send} disabled={sending} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {sending && <Loader2 size={14} className="animate-spin" />} {sending ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Sent Newsletters</h3>
        </div>
        {loadingHistory ? (
          <div className="py-6 text-center"><div className="w-5 h-5 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No newsletters sent yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((n) => (
              <div key={n._id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{n.subject}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(n.sentAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} · {n.recipientCount} recipient(s) · {n.audience}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}