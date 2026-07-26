// components/shared/ChangePasswordForm.tsx
'use client'

import { useState } from 'react'
import { Lock, Loader2, CheckCircle } from 'lucide-react'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async () => {
    setError('')
    setSuccess(false)

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Failed to update password')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Lock size={18} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Choose a strong password you don't use elsewhere.
      </p>

      <div className="space-y-3 max-w-sm">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm"
        />

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {success && (
          <p className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
            <CheckCircle size={13} /> Password updated
          </p>
        )}

        <button
          onClick={submit}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Update Password
        </button>
      </div>
    </div>
  )
}