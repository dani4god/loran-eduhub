'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, RefreshCw, CheckCircle, Smartphone, Monitor, DoorOpen } from 'lucide-react'

interface DiscordInfo {
  discordUsername?: string | null
  discordRoles?: string[]
  isConnected: boolean
}

export default function ExamPrepDiscordPage() {
  const [info, setInfo] = useState<DiscordInfo | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [regNumber, setRegNumber] = useState('')

  useEffect(() => {
    const reg = localStorage.getItem('examPrepRegNumber') || ''
    setRegNumber(reg)
    fetch(`/api/exam-prep/discord?regNumber=${reg}`).then((r) => r.json()).then(setInfo)
  }, [])

  const connect = () => {
    window.location.href = `/api/exam-prep/discord/connect?regNumber=${regNumber}`
  }

  const resync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/exam-prep/discord/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regNumber }),
      })
      const d = await res.json()
      if (res.ok) setInfo((prev) => (prev ? { ...prev, discordRoles: d.assignedRoles } : prev))
    } finally {
      setSyncing(false)
    }
  }

  if (!info) return null

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Discord</h1>

      {!info.isConnected ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7 text-[#5865F2]" />
          </div>
          <h2 className="font-bold text-gray-900 mb-1">Join Our Exam Prep Community</h2>
          <p className="text-sm text-gray-500 mb-4">
            Get your questions answered instantly by professional tutors, receive instant
            assistance in your exam journey, and get university & scholarship updates.
          </p>
          <button onClick={connect} className="px-5 py-2.5 bg-[#5865F2] text-white rounded-xl text-sm font-semibold hover:bg-[#4752C4]">
            Connect Discord
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center shrink-0">
              <MessageSquare size={18} className="text-[#5865F2]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">@{info.discordUsername}</p>
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={11} /> Connected</span>
            </div>
          </div>

          {info.discordRoles && info.discordRoles.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Server Role</p>
              <div className="flex flex-wrap gap-2">
                {info.discordRoles.map((role) => (
                  <span key={role} className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#5865F2]/10 text-[#5865F2] px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-[#5865F2] rounded-full shrink-0" /> {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={resync} disabled={syncing} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#5865F2] text-white rounded-xl text-sm font-semibold hover:bg-[#4752C4] disabled:opacity-50">
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Re-sync Role'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-sm mb-4">How to Get Set Up on Discord</h2>
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><Smartphone size={13} /> On Your Phone</p>
          <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
            <li>Download the <strong>Discord</strong> app from the App Store or Google Play Store</li>
            <li>Create a free account, or log in if you already have one</li>
            <li>Verify your email if prompted</li>
          </ol>
        </div>
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><Monitor size={13} /> On a PC</p>
          <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
            <li>Go to <a href="https://discord.com/download" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">discord.com/download</a></li>
            <li>Install and open Discord, then log in or create an account</li>
          </ol>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><DoorOpen size={13} /> Joining</p>
          <p className="text-xs text-gray-600">Once logged into Discord, click "Connect Discord" above to join our server automatically.</p>
        </div>
      </div>
    </div>
  )
}