// app/(public)/workshop/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSlider from '@/components/workshop/HeroSlider'
import {
  Calendar, Users, Download, Loader2, ExternalLink, CheckCircle2,
  Sparkles, Award, Smartphone, UserPlus, DoorOpen,
} from 'lucide-react'

interface Speaker {
  name: string; title: string; institution: string;
  sessionTitle: string; description: string; points: string[]; isConvener: boolean
}
interface WorkshopData {
  heading: string; subheading: string; speakers: Speaker[]; advertImages: string[]; discordInviteLink: string
}

const SPEAKER_COLORS = [
  { bg: 'from-blue-500 to-indigo-600', tag: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
  { bg: 'from-purple-500 to-pink-600', tag: 'bg-purple-50 text-purple-600', dot: 'bg-purple-400' },
  { bg: 'from-emerald-500 to-teal-600', tag: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400' },
  { bg: 'from-orange-500 to-red-600', tag: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
]

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
    setError(''); setSuccess(false); setDownloading(true)
    try {
      const res = await fetch('/api/workshop/certificates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), fullName: fullName.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to generate certificate')
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full px-4 py-1.5 mb-5 shadow-lg shadow-blue-500/20">
              <Sparkles size={13} className="text-white" />
              <span className="text-white text-xs font-bold uppercase tracking-wide">Upcoming Launch Workshop</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              {data.heading}
            </h1>
            <p className="text-gray-600 text-base sm:text-xl max-w-2xl mx-auto font-medium">{data.subheading}</p>
          </div>

          <HeroSlider images={data.advertImages} />

          {/* Speakers */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Users size={20} className="text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Speakers & Sessions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data.speakers.map((sp, i) => {
                const color = SPEAKER_COLORS[i % SPEAKER_COLORS.length]
                return (
                  <div key={i} className="relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${color.bg}`} />
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${color.tag}`}>
                          Speaker {i + 1}
                        </span>
                        {sp.isConvener && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                            <Award size={11} /> Convener
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg">{sp.name}</h3>
                      {(sp.title || sp.institution) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {sp.title}{sp.title && sp.institution ? ' · ' : ''}{sp.institution}
                        </p>
                      )}

                      <div className={`w-full h-px my-3.5 bg-gradient-to-r ${color.bg} opacity-20`} />

                      <p className="text-sm font-bold text-gray-800">{sp.sessionTitle}</p>
                      <p className="text-sm text-gray-500 italic mt-1 mb-4">"{sp.description}"</p>

                      <ul className="space-y-2">
                        {sp.points.map((pt, pi) => (
                          <li key={pi} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${color.dot}`} />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Discord join */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-10 mb-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Join Us on Discord</h2>
                <p className="text-indigo-100 text-sm max-w-lg mx-auto">
                  All workshop sessions and community discussion happen live in our Discord server.
                  Here's how to get set up:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: <Smartphone size={18} />, step: '1', title: 'Download Discord', desc: 'Get the app from the App Store, Google Play, or discord.com for desktop.' },
                  { icon: <UserPlus size={18} />, step: '2', title: 'Create an Account', desc: 'Sign up with your email, pick a username, and verify your account.' },
                  { icon: <DoorOpen size={18} />, step: '3', title: 'Join the Server', desc: 'Click the button below, accept the invite, and say hello in #welcome.' },
                ].map((s) => (
                  <div key={s.step} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                      {s.icon}
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{s.step}. {s.title}</p>
                    <p className="text-indigo-100 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                {data.discordInviteLink ? (
                  <a
                    href={data.discordInviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all hover:scale-105 shadow-lg text-sm"
                  >
                    Join Our Discord Community <ExternalLink size={16} />
                  </a>
                ) : (
                  <p className="text-indigo-200 text-sm">Discord link coming soon.</p>
                )}
              </div>
            </div>
          </div>

          {/* Certificate download */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
            <div className="text-center mb-7">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <Download size={24} className="text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Download Your Certificate</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Attended a workshop? Enter the code shared by our team and your full name to get your
                Certificate of Participation.
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your 12-digit code"
                maxLength={12}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono focus:border-blue-400 focus:outline-none transition-colors"
              />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:outline-none transition-colors"
              />

              {error && <p className="text-xs text-red-600 text-center font-medium">{error}</p>}
              {success && (
                <p className="flex items-center justify-center gap-1 text-xs font-semibold text-green-600">
                  <CheckCircle2 size={13} /> Certificate downloaded
                </p>
              )}

              <button
                onClick={downloadCertificate}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
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