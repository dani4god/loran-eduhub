// app/(public)/workshop/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Calendar, Users, Download, Loader2, ExternalLink, CheckCircle2,
  ImageIcon,
} from 'lucide-react'

interface Speaker { name: string; sessionTitle: string; description: string; points: string[] }
interface WorkshopData {
  heading: string; subheading: string; speakers: Speaker[]; advertImages: string[]; discordInviteLink: string
}

export default function WorkshopPage() {
  const [data, setData] = useState<WorkshopData | null>(null)
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/workshop').then((r) => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  const downloadCertificate = async () => {
    if (!code.trim() || !fullName.trim()) {
      setError('Please enter both the code and your full name')
      return
    }
    setError('')
    setSuccess(false)
    setDownloading(true)
    try {
      const res = await fetch('/api/workshop/certificates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), fullName: fullName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to generate certificate')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Certificate-${fullName.trim().replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading || !data) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-3.5 py-1.5 mb-4">
              <Calendar size={14} className="text-blue-600" />
              <span className="text-blue-700 text-xs font-semibold">Upcoming Launch Workshop</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">{data.heading}</h1>
            <p className="text-gray-500 text-sm sm:text-lg max-w-2xl mx-auto">{data.subheading}</p>
          </div>

          {/* Advert images */}
          {data.advertImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {data.advertImages.map((img, i) => (
                <img key={i} src={img} alt={`Workshop ${i + 1}`} className="w-full h-32 sm:h-40 object-cover rounded-2xl" />
              ))}
            </div>
          )}

          {/* Speakers */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Users size={18} className="text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Speakers & Sessions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.speakers.map((sp, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Speaker {i + 1}</span>
                  <h3 className="font-bold text-gray-900 text-base mt-1">{sp.name}</h3>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{sp.sessionTitle}</p>
                  <p className="text-sm text-gray-500 italic mt-1 mb-3">"{sp.description}"</p>
                  <ul className="space-y-1.5">
                    {sp.points.map((pt, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-blue-400 mt-0.5">•</span> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Discord join */}
          <div className="bg-indigo-600 rounded-2xl p-6 sm:p-8 text-center mb-10">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Join Us on Discord</h2>
            <p className="text-indigo-100 text-sm max-w-md mx-auto mb-3">
              1. Click the button below · 2. Accept the server invite · 3. Introduce yourself in #welcome
            </p>
            <p className="text-indigo-200 text-xs mb-5">All workshop sessions and updates happen live in our Discord community.</p>
            {data.discordInviteLink ? (
              <a
                href={data.discordInviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-sm"
              >
                Join Our Discord Community <ExternalLink size={15} />
              </a>
            ) : (
              <p className="text-indigo-200 text-xs">Discord link coming soon.</p>
            )}
          </div>

          {/* Certificate download */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Download size={22} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Download Your Certificate of Participation</h2>
              <p className="text-sm text-gray-500 mt-1">
                Attended a workshop? Enter the code shared by our team and your full name below.
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your 12-digit code"
                maxLength={12}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-center tracking-widest font-mono"
              />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />

              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
              {success && (
                <p className="flex items-center justify-center gap-1 text-xs font-semibold text-green-600">
                  <CheckCircle2 size={13} /> Certificate downloaded
                </p>
              )}

              <button
                onClick={downloadCertificate}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {downloading ? 'Generating...' : 'Download Certificate'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}