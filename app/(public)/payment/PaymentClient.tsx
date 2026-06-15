// app/(public)/payment/PaymentClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PaymentClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const studentId = searchParams.get('studentId')
  const plan = searchParams.get('plan')
  const amount = searchParams.get('amount')
  const enrollments = searchParams.get('enrollments')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!studentId || !plan) {
      router.push('/auth/student/register')
    }
  }, [studentId, plan, router])

  const handlePayment = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          plan,
          enrollments: enrollments?.split(','),
          amount: parseInt(amount || '0'),
          email,
        }),
      })

      const data = await response.json()

      if (data.success && data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl
      } else {
        alert('Payment initialization failed. Please try again.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const courseCount = enrollments?.split(',').length || 0
  const totalAmount = parseInt(amount || '0')

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
            <p className="text-gray-600 mb-6">Review your order and proceed to payment</p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold capitalize">{plan || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Number of Courses</span>
                <span className="font-semibold">{courseCount}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-2xl font-bold text-tutor">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || !studentId || !plan}
              className="w-full py-3 bg-gradient-to-r from-tutor to-brand-primary text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Pay with Paystack'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              You will be redirected to Paystack's secure payment page
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}