// app/(student)/dashboard/subscription/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

interface Enrollment {
  _id: string
  courseId: { name: string }
  tutorId: { firstName: string; lastName: string }
  plan: string
  status: string
  startDate: string
  endDate: string
  amount: number
}

// Separate component that uses useSession
function SubscriptionContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/student/login')
      return
    }

    if (session?.user?.email) {
      fetchEnrollments()
    }
  }, [session, status, router])

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments')
      const data = await response.json()
      setEnrollments(data.enrollments || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRenew = async (enrollmentId: string, currentPlan: string) => {
    const newPlan = prompt('Enter plan (3months, 6months, 1year):', currentPlan)
    if (newPlan) {
      const response = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, newPlan }),
      })
      const data = await response.json()
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      }
    }
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-tutor border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-3">Loading subscriptions...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-500">No active subscriptions</p>
          <Link href="/courses" className="mt-4 inline-block text-tutor">
            Browse Courses →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {enrollments.map((enrollment) => {
            const daysRemaining = getDaysRemaining(enrollment.endDate)
            const isExpired = daysRemaining <= 0
            const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0

            return (
              <div key={enrollment._id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{enrollment.courseId.name}</h3>
                    <p className="text-gray-600 text-sm">
                      Tutor: {enrollment.tutorId.firstName} {enrollment.tutorId.lastName}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    enrollment.status === 'active' ? 'bg-green-100 text-green-700' :
                    enrollment.status === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {enrollment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Plan</p>
                    <p className="font-semibold capitalize">{enrollment.plan}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount Paid</p>
                    <p className="font-semibold">₦{enrollment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p>{new Date(enrollment.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">End Date</p>
                    <p className={isExpiringSoon ? 'text-orange-600 font-semibold' : ''}>
                      {new Date(enrollment.endDate).toLocaleDateString()}
                      {!isExpired && daysRemaining > 0 && (
                        <span className="text-xs text-gray-500 block">({daysRemaining} days left)</span>
                      )}
                    </p>
                  </div>
                </div>

                {(isExpired || enrollment.status === 'expired') && (
                  <button
                    onClick={() => handleRenew(enrollment._id, enrollment.plan)}
                    className="w-full py-2 bg-tutor text-white rounded-lg hover:bg-tutor/90 transition"
                  >
                    Renew Subscription
                  </button>
                )}

                {isExpiringSoon && !isExpired && enrollment.status === 'active' && (
                  <button
                    onClick={() => handleRenew(enrollment._id, enrollment.plan)}
                    className="w-full py-2 border border-tutor text-tutor rounded-lg hover:bg-tutor/5 transition"
                  >
                    Renew Early
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Main page component with Suspense
export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-tutor border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-3">Loading subscriptions...</p>
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}