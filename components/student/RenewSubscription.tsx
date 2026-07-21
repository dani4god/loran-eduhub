// components/student/RenewSubscription.tsx
'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { Calendar, Loader2, CheckCircle } from 'lucide-react'

declare global {
  interface Window { PaystackPop: any }
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly', '3months': '3 Months', '6months': '6 Months', '1year': '1 Year Diploma',
}

interface MyEnrollment {
  enrollmentId: string; courseName: string; tutorName: string
  plan: string; daysLeft: number | null; endDate: string
}

export default function RenewSubscription() {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [renewingId, setRenewingId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/student/enrollments')
      .then(r => r.json())
      .then(d => setEnrollments(d.enrollments || []))
      .finally(() => setLoading(false))
  }, [])

  const renew = async (enrollment: MyEnrollment) => {
    const newPlan = selectedPlan[enrollment.enrollmentId] || enrollment.plan
    setRenewingId(enrollment.enrollmentId)
    setError('')

    try {
      const res = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollment.enrollmentId, newPlan }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to start renewal')
        setRenewingId(null)
        return
      }

      // authorizationUrl → full redirect flow (Paystack hosted checkout)
      window.location.href = data.authorizationUrl
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setRenewingId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">You have no active enrollments to renew.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">{error}</div>
      )}

      {enrollments.map(e => {
        const isUrgent = e.daysLeft !== null && e.daysLeft <= 5
        const plan = selectedPlan[e.enrollmentId] || e.plan

        return (
          <div key={e.enrollmentId} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{e.courseName}</p>
                <p className="text-xs text-gray-400">with {e.tutorName}</p>
              </div>
              {e.daysLeft !== null && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  e.daysLeft <= 0
                    ? 'bg-red-100 text-red-600'
                    : e.daysLeft <= 5
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {e.daysLeft <= 0 ? 'Expired' : `${e.daysLeft}d left`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {Object.entries(PLAN_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan({ ...selectedPlan, [e.enrollmentId]: key })}
                  className={`p-2 rounded-lg border-2 text-xs font-semibold text-center transition-all ${
                    plan === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {successId === e.enrollmentId ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle size={16} /> Renewal started — complete payment to confirm.
              </div>
            ) : (
              <button
                onClick={() => renew(e)}
                disabled={renewingId === e.enrollmentId}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {renewingId === e.enrollmentId && <Loader2 size={14} className="animate-spin" />}
                {renewingId === e.enrollmentId ? 'Redirecting to payment...' : 'Renew this course'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}