// components/shared/DangerZone.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface DangerZoneProps {
  endpoint: string
  warningText: string
  extraNote?: string
}

export default function DangerZone({ endpoint, warningText, extraNote }: DangerZoneProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canDelete = password.length > 0 && confirmText === 'DELETE'

  const submit = async () => {
    if (!canDelete) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok) {
        await signOut({ redirect: false })
        router.push('/')
      } else {
        setError(data.error || 'Failed to delete account')
        setDeleting(false)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-100 dark:border-red-900/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
        <h2 className="text-base sm:text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{warningText}</p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2.5 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Delete My Account
        </button>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 space-y-3 max-w-sm">
          {extraNote && <p className="text-xs text-red-700 dark:text-red-400">{extraNote}</p>}

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowConfirm(false); setPassword(''); setConfirmText(''); setError('') }}
              className="flex-1 py-2 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canDelete || deleting}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {deleting && <Loader2 size={13} className="animate-spin" />}
              Permanently Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}