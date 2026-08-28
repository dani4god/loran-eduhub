// app/(public)/lesson-notes/[id]/purchase/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { verifyWithRetry } from '@/lib/verifyWithRetry'
import { Loader2, CheckCircle2, Download } from 'lucide-react'

declare global { interface Window { PaystackPop: any } }

export default function LessonNotePurchasePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const [note, setNote] = useState<any>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [downloadRef, setDownloadRef] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/lesson-notes/${id}/public`)
      .then((r) => r.json())
      .then(setNote)
      .catch(() => setError('Failed to load lesson note'))
  }, [id])

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    if (reference) {
      verifyWithRetry(`/api/lesson-notes/${id}/verify?reference=${reference}`)
        .then((d) => {
          if (d.success) setDownloadRef(reference)
          else setError(d.error || 'Verification failed')
        })
        .catch(() => setError('Could not confirm payment — if you were charged, contact support with reference: ' + reference))
    }
  }, [id, searchParams])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form submission
    
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/lesson-notes/${id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to process purchase')
        setSubmitting(false)
        return
      }

      if (data.isFree) {
        setDownloadRef('free')
        setSubmitting(false)
        return
      }

      // Check if Paystack is loaded
      if (!scriptLoaded || !window.PaystackPop) {
        setError('Payment system is still loading. Please wait a moment and try again.')
        setSubmitting(false)
        return
      }

      try {
        const handler = window.PaystackPop.setup({
          key: data.publicKey,
          email: data.email,
          amount: Math.round(data.amount * 100),
          ref: data.reference,
          currency: 'NGN',
          callback: async (r: any) => {
            try {
              const d = await verifyWithRetry(`/api/lesson-notes/${id}/verify?reference=${r.reference}`)
              if (d.success) {
                setDownloadRef(r.reference)
              } else {
                setError(`${d.error || 'Verification failed'} — don't pay again, reference: ${r.reference}`)
              }
            } catch {
              setError(`Connection issue confirming payment — don't pay again, contact support with reference: ${r.reference}`)
            } finally {
              setSubmitting(false)
            }
          },
          onClose: () => {
            setSubmitting(false)
          },
        })
        handler.openIframe()
      } catch (err: any) {
        setError('Could not open the payment window. Please refresh and try again.')
        setSubmitting(false)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setSubmitting(false)
    }
  }

  const download = () => {
    const url = downloadRef === 'free'
      ? `/api/lesson-notes/${id}/download`
      : `/api/lesson-notes/${id}/download?reference=${downloadRef}`
    window.location.href = url
  }

  if (error && !downloadRef) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-md mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-blue-600 font-semibold hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Script 
        src="https://js.paystack.co/v1/inline.js" 
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError('Failed to load payment system. Please refresh and try again.')}
      />
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          {downloadRef ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-gray-900 mb-1">You're all set!</p>
              <p className="text-sm text-gray-500 mb-5">Download your lesson note below.</p>
              <button
                onClick={download}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
              >
                <Download size={16} /> Download Lesson Note
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h1 className="text-lg font-bold text-gray-900 mb-1">
                {note?.title || 'Loading...'}
              </h1>
              <p className="text-sm text-blue-600 font-semibold mb-5">
                {note?.isFree ? 'Free' : `₦${note?.price?.toLocaleString('en-NG')}`}
              </p>
              <form onSubmit={submit} className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email (for your download link)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || !note}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {!note ? 'Loading...' : note?.isFree ? 'Get Free Lesson Note' : `Pay ₦${note?.price?.toLocaleString('en-NG')}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}