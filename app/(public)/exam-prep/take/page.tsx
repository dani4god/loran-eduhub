'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { verifyWithRetry } from '@/lib/verifyWithRetry'
import { Loader2 } from 'lucide-react'

declare global { interface Window { PaystackPop: any } }

export default function ExamPrepLoginPage() {
  const router = useRouter()
  const [regNumber, setRegNumber] = useState('')
  const [forgotName, setForgotName] = useState('')
  const [matches, setMatches] = useState<any[]>([])
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [showPlans, setShowPlans] = useState(false)
  const [email, setEmail] = useState('')

  const login = async () => {
    if (!regNumber.trim()) { setError('Enter your registration number'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/exam-prep/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regNumber: regNumber.trim() }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }

      if (data.requiresPayment) {
        // public plans endpoint fallback
        const plansRes = await fetch('/api/exam-prep/plans')
        const plansData = await plansRes.json()
        setPlans(plansData.plans || [])
        setShowPlans(true)
        setLoading(false)
        return
      }

      localStorage.setItem('examPrepRegNumber', data.student.regNumber)
      router.push('/exam-prep/dashboard/take')
    } finally {
      setLoading(false)
    }
  }

  const subscribe = async (duration: string) => {
    if (!email.trim()) { setError('Enter your email to receive a receipt'); return }
    setError('')

    const res = await fetch('/api/exam-prep/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regNumber: regNumber.trim(), duration, email }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }

    // Guard against the popup script not being ready yet — this was the
    // actual bug: clicking a plan before Paystack's script finished loading
    // silently failed with no visible error.
    if (typeof window === 'undefined' || !window.PaystackPop) {
      setError('Payment system is still loading — please wait a moment and try again.')
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
            const d = await verifyWithRetry(`/api/exam-prep/subscribe/verify?reference=${r.reference}`)
            if (d.success) {
              localStorage.setItem('examPrepRegNumber', regNumber.trim())
              router.push('/exam-prep/dashboard/take')
            } else {
              setError(d.error || 'Verification failed')
            }
          } catch {
            setError(`Connection issue confirming payment — don't pay again, reference: ${r.reference}`)
          }
        },
        onClose: () => {},
      })
      handler.openIframe()
    } catch (err: any) {
      setError('Could not open the payment window. Please refresh and try again.')
    }
  }

  const findRegNumber = async () => {
    const res = await fetch('/api/exam-prep/forgot-reg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: forgotName }) })
    const data = await res.json()
    setMatches(data.matches || [])
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          {showPlans ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h1 className="text-lg font-bold text-gray-900 mb-1">Choose a Plan</h1>
              <p className="text-sm text-gray-500 mb-4">Practice exams require a subscription.</p>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3" />
              <div className="space-y-2">
                {plans.map((p) => (
                  <button key={p.duration} onClick={() => subscribe(p.duration)} className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-blue-400">
                    <span className="text-sm font-semibold capitalize">{p.duration.replace('months', ' Months').replace('month', ' Month')}</span>
                    <span className="text-sm font-bold text-blue-600">₦{p.price.toLocaleString('en-NG')}</span>
                  </button>
                ))}
              </div>
              {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h1 className="text-lg font-bold text-gray-900 mb-1">Practice Exam Login</h1>
              <p className="text-sm text-gray-500 mb-5">Enter your registration number to continue.</p>
              <input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="LEH/EXAM/2026/123456" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 font-mono" />
              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
              <button onClick={login} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">{loading && <Loader2 size={15} className="animate-spin" />} Continue</button>

              <button onClick={() => setShowForgot(!showForgot)} className="w-full text-center text-xs text-blue-600 mt-4">Forgot your registration number?</button>
              {showForgot && (
                <div className="mt-3 space-y-2">
                  <input value={forgotName} onChange={(e) => setForgotName(e.target.value)} placeholder="Enter your full name as used during registration" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={findRegNumber} className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold">Find My Registration Number</button>
                  {matches.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs flex items-center justify-between">
                      <span>{m.fullName} · {m.school}</span>
                      <button onClick={() => setRegNumber(m.regNumber)} className="text-blue-600 font-semibold">Use this</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-center text-xs text-gray-400 mt-4">Not registered yet? <a href="/exam-prep/register" className="text-blue-600 underline">Register here</a></p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}