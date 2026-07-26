// components/settings/TutorPricingSettings.tsx
'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Save, CheckCircle } from 'lucide-react'

interface Pricing {
  monthly: number
  threeMonths: number
  sixMonths: number
  oneYear: number
}

const FIELDS: { key: keyof Pricing; label: string; placeholder: string }[] = [
  { key: 'monthly', label: 'Monthly', placeholder: 'e.g. 15000' },
  { key: 'threeMonths', label: '3 Months', placeholder: 'e.g. 40000' },
  { key: 'sixMonths', label: '6 Months', placeholder: 'e.g. 75000' },
  { key: 'oneYear', label: '1 Year', placeholder: 'e.g. 140000' },
]

export default function TutorPricingSettings() {
  const [pricing, setPricing] = useState<Pricing>({
    monthly: 0,
    threeMonths: 0,
    sixMonths: 0,
    oneYear: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/tutor/pricing')
      .then(r => r.json())
      .then(d => {
        if (d.pricing) setPricing(d.pricing)
      })
      .finally(() => setLoading(false))
  }, [])

  const updateField = (key: keyof Pricing, value: string) => {
    setPricing(prev => ({ ...prev, [key]: value === '' ? 0 : Number(value) }))
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/tutor/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricing),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pricing updated. This applies to new enrollments only — existing students keep their original price.' })
        setPricing(data.pricing)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update pricing' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
          <DollarSign size={18} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Course Pricing</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Set what students pay to enroll with you for each plan. Changing a price only
        affects new enrollments — students already enrolled keep the price they signed up at.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {field.label}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
              <input
                type="number"
                min={1}
                value={pricing[field.key] || ''}
                onChange={e => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 text-xs rounded-xl p-3 mb-4 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/40'
          }`}
        >
          {message.type === 'success' && <CheckCircle size={14} className="shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        <Save size={15} /> {saving ? 'Saving...' : 'Save Pricing'}
      </button>
    </div>
  )
}