// app/dashboard/self-paced/discord/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { MessageSquare, RefreshCw, CheckCircle } from 'lucide-react'

interface DiscordInfo {
  discordUsername?: string | null
  discordRoles?: string[]
  isConnected: boolean
}

export default function SelfPacedDiscordPage() {
  const { update } = useSession()
  const [info, setInfo] = useState<DiscordInfo | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [ready, setReady] = useState(false)

  const load = () => {
    fetch('/api/self-paced/discord').then((r) => r.json()).then(setInfo)
  }

  useEffect(() => {
    // Forces NextAuth to refetch /api/auth/session and rebuild the JWT from
    // whatever's currently in the database — closes the gap where the
    // Discord link succeeded server-side but the browser's session cookie
    // still reflects the pre-link state.
    update().finally(() => {
      load()
      setReady(true)
    })
  }, [update])

  const connect = () => signIn('discord', { callbackUrl: '/dashboard/self-paced/discord' })

  const resync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/self-paced/discord/sync', { method: 'POST' })
      const d = await res.json()
      if (res.ok) {
        setInfo((prev) => (prev ? { ...prev, discordRoles: d.assignedRoles } : prev))
        // Re-fetch the full info after sync
        load()
      }
    } finally {
      setSyncing(false)
    }
  }

  if (!ready || !info) return (
    <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm mt-3">Loading Discord info...</p>
      </div>
    </div>
  )

  return (
    <div className="pt-16 lg:pt-0 min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Discord</h1>

        {!info.isConnected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <div className="w-14 h-14 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-7 h-7 text-[#5865F2]" />
            </div>
            <h2 className="font-bold text-gray-900 mb-1">Connect Discord</h2>
            <p className="text-sm text-gray-500 mb-4">Link your Discord account to join our community and get your course roles.</p>
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
                      <div className="w-1.5 h-1.5 bg-[#5865F2] rounded-full shrink-0" />
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={resync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#5865F2] text-white rounded-xl text-sm font-semibold hover:bg-[#4752C4] disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Re-sync Roles'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}