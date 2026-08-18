// app/(student)/dashboard/self-paced/purchase/page.tsx
'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { Layers, DollarSign, Loader2, CheckCircle2 } from 'lucide-react'

declare global { interface Window { PaystackPop: any } }

// Client component that uses useSearchParams
function PurchaseContent() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const load = () => fetch('/api/self-paced/courses/available').then((r) => r.json()).then((d) => setCourses(d.courses || [])).finally(() => setLoading(false))

  useEffect(() => {
    load()
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    if (reference) {
      fetch(`/api/self-paced/purchase/quick/verify?reference=${reference}`).then((r) => r.json()).then((d) => {
        setMessage(d.success ? 'Course added to your dashboard!' : d.error)
        load()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buy = async (course: any) => {
    setBuyingId(course._id)
    try {
      const res = await fetch('/api/self-paced/purchase/quick', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course._id }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage(data.error); setBuyingId(null); return }

      if (!data.requiresPayment) {
        setMessage('Course added to your dashboard!')
        load()
        setBuyingId(null)
        return
      }

      const handler = window.PaystackPop.setup({
        key: data.publicKey, email: data.email, amount: Math.round(data.amount * 100), ref: data.reference, currency: 'NGN',
        callback: (r: any) => {
          fetch(`/api/self-paced/purchase/quick/verify?reference=${r.reference}`).then((res) => res.json()).then((d) => {
            setMessage(d.success ? 'Course added to your dashboard!' : d.error)
            load()
          }).finally(() => setBuyingId(null))
        },
        onClose: () => setBuyingId(null),
      })
      handler.openIframe()
    } catch { setBuyingId(null) }
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" onLoad={() => setScriptLoaded(true)} strategy="afterInteractive" />
      <div className="pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Purchase Another Course</h1>
          <p className="text-sm text-gray-500 mb-5">Your account is already set up — just pick a course and confirm.</p>

          {message && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-3 mb-4">{message}</p>}

          {loading ? (
            <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : courses.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">You already own every available course, or none are published yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((c) => (
                <div key={c._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="h-28 bg-gray-100">
                    {c.coverImageUrl ? <img src={c.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-7 h-7 text-gray-300" /></div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm">{c.title}</h3>
                    <p className="text-xs text-gray-400 mb-3">{c.tutorName} · {c.weekCount} weeks</p>
                    <button onClick={() => buy(c)} disabled={buyingId === c._id} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                      {buyingId === c._id ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                      {c.isFree ? 'Get Free Course' : `Buy for ₦${c.price.toLocaleString('en-NG')}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Main page component with Suspense boundary
export default function PurchaseAnotherCoursePage() {
  return (
    <Suspense fallback={
      <div className="pt-16 lg:pt-0 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <PurchaseContent />
    </Suspense>
  )
}