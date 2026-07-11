
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import {
  MessageSquare,
  RefreshCw,
  Users,
  ExternalLink,
  CheckCircle,
} from 'lucide-react'

interface DiscordInfo {
  discordId?: string | null
  discordUsername?: string | null
  discordRoles?: string[]
  isConnected: boolean
}

export default function DiscordIntegration({
  initialData,
}: {
  initialData: DiscordInfo
}) {
  const [discordInfo, setDiscordInfo] = useState(initialData)
  const [syncing, setSyncing] = useState(false)
  const [syncingStudents, setSyncingStudents] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const INVITE_LINK =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK ||
    'https://discord.gg/S57mKuNRA'

  const handleConnect = () => {
    signIn('discord', {
      callbackUrl: '/dashboard/tutor?tab=discord',
    })
  }

  const handleReSyncTutor = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const res = await fetch('/api/discord/sync-tutor', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setSyncResult(
          `✅ Roles synced: ${data.assignedRoles?.join(', ') || 'none'}${
            data.missingRoles?.length > 0
              ? `\n⚠️ Missing roles in server: ${data.missingRoles.join(', ')}`
              : ''
          }`
        )

        setDiscordInfo((prev) => ({
          ...prev,
          discordRoles: data.assignedRoles || [],
        }))
      } else {
        setSyncResult(`❌ ${data.error || 'Sync failed'}`)
      }
    } catch (err: any) {
      setSyncResult(`❌ ${err.message || 'Something went wrong'}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncStudents = async () => {
    setSyncingStudents(true)
    setSyncResult(null)

    try {
      const res = await fetch('/api/discord/sync', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        const synced =
          data.results?.filter(
            (r: any) => r.status === 'synced'
          ).length || 0

        const errors =
          data.results?.filter(
            (r: any) => r.status === 'error'
          ).length || 0

        const noDiscord =
          data.results?.filter(
            (r: any) => r.status === 'no_discord_linked'
          ).length || 0

        setSyncResult(
          `✅ Students synced: ${synced}${
            errors > 0 ? ` | ❌ Errors: ${errors}` : ''
          }${
            noDiscord > 0
              ? ` | ⚠️ No Discord: ${noDiscord}`
              : ''
          }`
        )
      } else {
        setSyncResult(`❌ ${data.error || 'Sync failed'}`)
      }
    } catch (err: any) {
      setSyncResult(`❌ ${err.message || 'Something went wrong'}`)
    } finally {
      setSyncingStudents(false)
    }
  }

  // Not connected
  if (!discordInfo.isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#5865F2] to-[#404EED] p-8 text-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Connect Your Discord
            </h2>

            <p className="text-white/80 max-w-md mx-auto text-sm">
              Link your Discord account to automatically receive your
              tutor roles on the Loran EduHub server.
            </p>
          </div>
        </div>

        <div className="p-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 flex-wrap">
            {[
              'Auto-role assignment',
              'Course channel access',
              'Student management',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-1.5"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <p className="text-sm text-gray-500 font-medium">
              Step 1 — Connect your Discord account
            </p>

            <button
              onClick={handleConnect}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-xl hover:bg-[#4752C4] transition-all font-semibold shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
              Connect Discord
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Connected
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#5865F2]" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Discord Connected
            </h2>

            <p className="text-sm text-gray-500">
              @{discordInfo.discordUsername || 'unknown'}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Active
          </div>
        </div>

        {discordInfo.discordRoles &&
          discordInfo.discordRoles.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your Server Roles
              </p>

              <div className="flex flex-wrap gap-2">
                {discordInfo.discordRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#5865F2]/10 text-[#5865F2] px-3 py-1.5 rounded-full"
                  >
                    <div className="w-1.5 h-1.5 bg-[#5865F2] rounded-full" />
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

        <div className="bg-gradient-to-r from-[#5865F2]/5 to-[#404EED]/5 border border-[#5865F2]/15 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Loran EduHub Server
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                Join to access your course channels. Your roles will
                be assigned automatically.
              </p>
            </div>

            <a
              href={INVITE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition text-sm font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              Join Server
            </a>
          </div>
        </div>

        {syncResult && (
          <div
            className={`text-xs rounded-xl p-3 mb-4 whitespace-pre-line ${
              syncResult.startsWith('✅')
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            {syncResult}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleReSyncTutor}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5865F2] text-white rounded-xl text-sm font-semibold hover:bg-[#4752C4] transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                syncing ? 'animate-spin' : ''
              }`}
            />

            {syncing ? 'Syncing...' : 'Re-sync My Roles'}
          </button>

          <button
            onClick={handleSyncStudents}
            disabled={syncingStudents}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Users
              className={`w-4 h-4 ${
                syncingStudents ? 'animate-pulse' : ''
              }`}
            />

            {syncingStudents
              ? 'Syncing Students...'
              : 'Sync Student Roles'}
          </button>
        </div>
      </div>
    </div>
  )
}

