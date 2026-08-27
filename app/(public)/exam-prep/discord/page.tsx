// app/(public)/exam-prep/discord/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, RefreshCw, CheckCircle, Smartphone, Monitor, DoorOpen, BookOpen } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface DiscordInfo {
  discordUsername?: string | null
  discordRoles?: string[]
  isConnected: boolean
}

// Client component that uses useSearchParams
function ExamPrepDiscordPageContent() {
  const searchParams = useSearchParams()
  const [info, setInfo] = useState<DiscordInfo | null>(null)
  const [syncing, setSyncing] = useState(false)

  const load = () => {
    fetch('/api/exam-prep/discord').then((r) => r.json()).then(setInfo)
  }

  useEffect(() => {
    const justConnected = searchParams.get('connected') === '1'
    if (justConnected) {
      signOut({ callbackUrl: '/auth/exam-prep/login?reconnected=1' })
      return
    }
    load()
  }, [searchParams])

  const connect = () => signIn('discord', { callbackUrl: '/exam-prep/discord?connected=1' })

  const resync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/exam-prep/discord/sync', { method: 'POST' })
      const d = await res.json()
      if (res.ok) setInfo((prev) => (prev ? { ...prev, discordRoles: d.assignedRoles } : prev))
    } finally {
      setSyncing(false)
    }
  }

  if (!info) return null

  return (
    <>
      <Navbar />
      <div className="pt-24 lg:pt-28 min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Exam Prep Discord</h1>
          </div>
          <p className="text-sm text-gray-500 -mt-2 mb-4">
            Connect your Discord to access the Exam Preparation community and get your student role.
          </p>

          {!info.isConnected ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <div className="w-14 h-14 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-[#5865F2]" />
              </div>
              <h2 className="font-bold text-gray-900 mb-1">Connect Discord</h2>
              <p className="text-sm text-gray-500 mb-4">
                Link your Discord account to join the Exam Preparation community and get your student roles.
              </p>
              <button
                onClick={connect}
                className="px-5 py-2.5 bg-[#5865F2] text-white rounded-xl text-sm font-semibold hover:bg-[#4752C4] transition"
              >
                Connect Discord
              </button>
              <p className="text-xs text-gray-400 mt-3">
                You'll be asked to log back in after connecting, to finish syncing your account.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center shrink-0">
                  <MessageSquare size={18} className="text-[#5865F2]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">@{info.discordUsername}</p>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle size={11} /> Connected
                  </span>
                </div>
              </div>

              {info.discordRoles && info.discordRoles.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Server Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {info.discordRoles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#5865F2]/10 text-[#5865F2] px-3 py-1.5 rounded-full"
                      >
                        <div className="w-1.5 h-1.5 bg-[#5865F2] rounded-full shrink-0" /> {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={resync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#5865F2] text-white rounded-xl text-sm font-semibold hover:bg-[#4752C4] disabled:opacity-50 transition"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Re-sync Roles'}
              </button>
            </div>
          )}

          {/* Discord setup steps */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 text-sm mb-4">How to Get Set Up on Discord</h2>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <Smartphone size={13} /> On Your Phone
              </p>
              <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
                <li>Download the <strong>Discord</strong> app from the App Store (iPhone) or Google Play Store (Android)</li>
                <li>Open the app and create a free account, or log in if you already have one</li>
                <li>Verify your email address if prompted</li>
                <li>Make sure you're logged in before trying to join our server — you can't access the community until you are</li>
              </ol>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <Monitor size={13} /> On a Windows/Mac PC
              </p>
              <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
                <li>Go to <a href="https://discord.com/download" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">discord.com/download</a> and download the app for your computer</li>
                <li>Run the installer and let it finish setting up automatically</li>
                <li>Open Discord, create a free account, or log in if you already have one</li>
                <li>Verify your email address if prompted</li>
              </ol>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <DoorOpen size={13} /> Joining the Community
              </p>
              <p className="text-xs text-gray-600">
                Once you're logged into Discord (app or PC), connect your account above and re-sync your roles — 
                you'll then be able to access the Loran EduHub Exam Preparation server and your course channels.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">Note:</span> You must have an active Exam Prep subscription to receive the 
                <span className="font-medium text-[#5865F2]"> &quot;Exam Preparation Student&quot;</span> role in Discord.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

// Main page component with Suspense boundary
export default function ExamPrepDiscordPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <div className="pt-24 lg:pt-28 min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm mt-3">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    }>
      <ExamPrepDiscordPageContent />
    </Suspense>
  )
}