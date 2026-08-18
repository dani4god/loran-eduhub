'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { MessageSquare, RefreshCw, CheckCircle } from 'lucide-react'

export default function SelfPacedDiscordPage() {
  const [info, setInfo] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { fetch('/api/self-paced/discord').then((r) => r.json()).then(setInfo) }, [])

  const connect = () => signIn('discord', { callbackUrl: '/dashboard/self-paced/discord' })

  const resync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/self-paced/discord/sync', { method: 'POST' })
      const d = await res.json()
      if (res.ok) setInfo((p: any) => ({ ...p, discordRoles: d.assignedRoles }))
    } finally { setSyncing(false) }
  }

  if (!info) return null

  return (
    <div className="pt-16 lg:pt-0 min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Discord</h1>
        {!info.isConnected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <MessageSquare className="w-10 h-10 text-[#5865F2] mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Connect Discord to join our community.</p>
            <button onClick={connect} className="px-5 py-2.5 bg-[#5865F2] text-white rounded-xl text-sm font-semibold">Connect Discord</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-green-600 mb-3"><CheckCircle size={14} /> @{info.discordUsername}</p>
            <button onClick={resync} disabled={syncing} className="flex items-center gap-1.5 px-4 py-2 bg-[#5865F2] text-white rounded-lg text-sm font-semibold">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> Re-sync
            </button>
          </div>
        )}
      </div>
    </div>
  )
}