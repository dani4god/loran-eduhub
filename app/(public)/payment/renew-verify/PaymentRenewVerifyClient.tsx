'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle, XCircle } from 'lucide-react'

export default function PaymentRenewVerifyClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState('')
  const [newEndDate, setNewEndDate] = useState<string | null>(null)

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref')

    if (!reference) {
      setStatus('error')
      setError('Missing payment reference.')
      return
    }

    fetch(`/api/payments/verify-renewal?reference=${encodeURIComponent(reference)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStatus('success')
          setNewEndDate(d.newEndDate)
        } else {
          setStatus('error')
          setError(d.error || 'Verification failed.')
        }
      })
      .catch(() => {
        setStatus('error')
        setError('Could not verify payment. Please contact support.')
      })
  }, [searchParams])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {status === 'verifying' && (
              <>
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-sm">Confirming your renewal...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h1 className="font-bold text-xl text-gray-900 mb-2">Renewal Confirmed</h1>
                <p className="text-gray-500 text-sm mb-6">
                  {newEndDate
                    ? `Your access is now extended until ${new Date(newEndDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                    : 'Your subscription has been renewed.'}
                </p>
                <Link
                  href="/dashboard/student"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700"
                >
                  Go to Dashboard
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="font-bold text-xl text-gray-900 mb-2">Something Went Wrong</h1>
                <p className="text-gray-500 text-sm mb-6">{error}</p>
                <button
                  onClick={() => router.push('/dashboard/student')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200"
                >
                  Back to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}