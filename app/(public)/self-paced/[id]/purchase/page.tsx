// app/(public)/self-paced/[id]/purchase/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Loader2 } from 'lucide-react'

declare global { interface Window { PaystackPop: any } }

export default function PurchaseCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/self-paced/courses/${courseId}/public`).then((r) => r.json()).then(setCourse)
  }, [courseId])

  const submit = async () => {
    if (!firstName || !lastName || !email || !phone || !password) {
      setError('All fields are required'); return
    }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/self-paced/purchase/initiate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, password, courseId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to start purchase'); setSubmitting(false); return }

      if (data.isFree) {
        router.push('/self-paced/purchase-success')
        return
      }

      if (!scriptLoaded || !window.PaystackPop) { setError('Payment system loading, try again in a moment'); setSubmitting(false); return }

      const handler = window.PaystackPop.setup({
        key: data.publicKey, email: data.email, amount: Math.round(data.amount * 100), ref: data.reference,
        currency: 'NGN',
        callback: (response: any) => {
          fetch(`/api/self-paced/purchase/verify?reference=${response.reference}`)
            .then((r) => r.json())
            .then((d) => { if (d.success) router.push('/self-paced/purchase-success'); else setError(d.error || 'Verification failed') })
            .finally(() => setSubmitting(false))
        },
        onClose: () => setSubmitting(false),
      })
      handler.openIframe()
    } catch (err: any) {
      setError(err.message || 'Something went wrong'); setSubmitting(false)
    }
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" onLoad={() => setScriptLoaded(true)} strategy="afterInteractive" />
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h1 className="text-lg font-bold text-gray-900 mb-1">{course?.title || 'Loading...'}</h1>
            <p className="text-sm text-blue-600 font-semibold mb-5">{course?.isFree ? 'Free' : `₦${course?.price?.toLocaleString('en-NG')}`}</p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Create a password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button onClick={submit} disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {course?.isFree ? 'Get This Course Free' : `Pay ₦${course?.price?.toLocaleString('en-NG')}`}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}