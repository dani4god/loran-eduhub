// components/student/EnrollWithdrawTab.tsx
'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import {
  Plus, X, ShoppingCart, LogOut, AlertTriangle, CheckCircle,
  BookOpen, User, Loader2,
} from 'lucide-react'

declare global {
  interface Window { PaystackPop: any }
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  '3months': '3 Months',
  '6months': '6 Months',
  '1year': '1 Year Diploma',
}

const REASON_LABELS: Record<string, string> = {
  too_expensive: 'Too expensive',
  not_satisfied_with_tutor: 'Not satisfied with tutor',
  course_too_difficult: 'Course too difficult',
  course_too_easy: 'Course too easy / not challenging',
  no_longer_needed: 'No longer needed',
  found_alternative: 'Found a better alternative',
  technical_issues: 'Technical issues',
  schedule_conflict: 'Schedule conflict',
  other: 'Other',
}

interface Course { _id: string; name: string; category: string }
interface Tutor {
  _id: string; firstName: string; lastName: string; profileImage?: string
  courses: { _id: string }[]
  pricing: { monthly: number; threeMonths: number; sixMonths: number; oneYear: number }
}
interface CartItem {
  courseId: string; courseName: string
  tutorId: string; tutorName: string
  pricing: Tutor['pricing']
}
interface MyEnrollment {
  enrollmentId: string; courseId: string; courseName: string
  tutorId: string; tutorName: string; plan: string; status: string
  daysLeft: number | null
}

const PLAN_KEY_MAP: Record<string, keyof Tutor['pricing']> = {
  monthly: 'monthly', '3months': 'threeMonths', '6months': 'sixMonths', '1year': 'oneYear',
}

export default function EnrollWithdrawTab() {
  const router = useRouter()
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const [myEnrollments, setMyEnrollments] = useState<MyEnrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)

  // Enroll cart state
  const [courses, setCourses] = useState<Course[]>([])
  const [allTutors, setAllTutors] = useState<Tutor[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [plan, setPlan] = useState('monthly')
  const [paying, setPaying] = useState(false)
  const [enrollError, setEnrollError] = useState('')

  // Withdraw modal state
  const [withdrawTarget, setWithdrawTarget] = useState<MyEnrollment | null>(null)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')

  const loadMyEnrollments = () => {
    setLoadingEnrollments(true)
    fetch('/api/student/enrollments')
      .then(r => r.json())
      .then(d => setMyEnrollments(d.enrollments || []))
      .finally(() => setLoadingEnrollments(false))
  }

  useEffect(() => {
    loadMyEnrollments()
    fetch('/api/courses/simple').then(r => r.json()).then(d => setCourses(d.courses || []))
    fetch('/api/tutors/all').then(r => r.json()).then(d => setAllTutors(d.tutors || []))
  }, [])

  const enrolledPairs = new Set(myEnrollments.map(e => `${e.courseId}:${e.tutorId}`))

  const tutorsForSelectedCourse = allTutors.filter(t =>
    t.courses.some(c => c._id === selectedCourseId) &&
    !enrolledPairs.has(`${selectedCourseId}:${t._id}`) &&
    !cart.some(c => c.courseId === selectedCourseId && c.tutorId === t._id)
  )

  const addToCart = (tutor: Tutor) => {
    const course = courses.find(c => c._id === selectedCourseId)
    if (!course) return
    setCart([...cart, {
      courseId: course._id, courseName: course.name,
      tutorId: tutor._id, tutorName: `${tutor.firstName} ${tutor.lastName}`,
      pricing: tutor.pricing,
    }])
    setSelectedCourseId('')
  }

  const removeFromCart = (i: number) => setCart(cart.filter((_, idx) => idx !== i))

  const cartTotal = cart.reduce((sum, item) => sum + (item.pricing?.[PLAN_KEY_MAP[plan]] || 0), 0)

  const handlePay = async () => {
    if (cart.length === 0) return
    setPaying(true)
    setEnrollError('')

    try {
      const res = await fetch('/api/student/enroll/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          selections: cart.map(c => ({ courseId: c.courseId, tutorId: c.tutorId })),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setEnrollError(data.error || 'Failed to start payment')
        setPaying(false)
        return
      }

      if (!scriptLoaded || !window.PaystackPop) {
        setEnrollError('Payment system not ready — please wait and try again')
        setPaying(false)
        return
      }

      const handler = window.PaystackPop.setup({
        key: data.publicKey,
        email: data.email,
        amount: Math.round(data.amount * 100),
        ref: data.reference,
        currency: 'NGN',
        callback: (response: any) => {
          fetch(`/api/student/enroll/verify?reference=${encodeURIComponent(response.reference)}`)
            .then(r => r.json())
            .then(d => {
              if (d.success) {
                setCart([])
                loadMyEnrollments()
                router.push('/dashboard/student/library')
              } else {
                setEnrollError(d.error || 'Verification failed')
              }
            })
            .finally(() => setPaying(false))
        },
        onClose: () => setPaying(false),
      })
      handler.openIframe()
    } catch (err: any) {
      setEnrollError(err.message || 'Something went wrong')
      setPaying(false)
    }
  }

  const submitWithdraw = async () => {
    if (!withdrawTarget || !reason) return
    setWithdrawing(true)
    setWithdrawError('')

    try {
      const res = await fetch('/api/student/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: withdrawTarget.enrollmentId, reason, feedback }),
      })
      const data = await res.json()

      if (res.ok) {
        setWithdrawTarget(null)
        setReason('')
        setFeedback('')
        loadMyEnrollments()
      } else {
        setWithdrawError(data.error || 'Failed to withdraw')
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'Something went wrong')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />

      {/* ── Enroll section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart size={18} className="text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Enroll in a New Course</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Add courses to your cart, choose a plan, then pay once — no need to register again.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="">Select a course...</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {selectedCourseId && (
          <div className="mb-4 space-y-2">
            {tutorsForSelectedCourse.length === 0 ? (
              <p className="text-xs text-gray-400">No available tutors for this course (or you're already enrolled with all of them).</p>
            ) : (
              tutorsForSelectedCourse.map(t => (
                <button
                  key={t._id}
                  onClick={() => addToCart(t)}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{t.firstName} {t.lastName}</p>
                    <p className="text-xs text-gray-400">₦{t.pricing.monthly.toLocaleString('en-NG')}/mo</p>
                  </div>
                  <Plus size={16} className="text-blue-500 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {cart.length > 0 && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cart</p>
            {cart.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <BookOpen size={16} className="text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.courseName}</p>
                  <p className="text-xs text-gray-400 truncate">with {item.tutorName}</p>
                </div>
                <button onClick={() => removeFromCart(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Plan</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(PLAN_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPlan(key)}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                      plan === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-900">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-bold text-blue-600 text-lg">₦{cartTotal.toLocaleString('en-NG')}</span>
            </div>

            {enrollError && <p className="text-xs text-red-600">{enrollError}</p>}

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying && <Loader2 size={16} className="animate-spin" />}
              {paying ? 'Processing...' : `Pay ₦${cartTotal.toLocaleString('en-NG')}`}
            </button>
          </div>
        )}
      </div>

      {/* ── Withdraw section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <LogOut size={18} className="text-red-500" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Withdraw from a Course</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Withdrawing ends your access to that course immediately. There's no refund.
        </p>

        {loadingEnrollments ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : myEnrollments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">You have no active enrollments.</p>
        ) : (
          <div className="space-y-2">
            {myEnrollments.map(e => (
              <div key={e.enrollmentId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <BookOpen size={16} className="text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.courseName}</p>
                  <p className="text-xs text-gray-400 truncate">
                    with {e.tutorName} · {PLAN_LABELS[e.plan] || e.plan}
                    {e.daysLeft !== null && ` · ${e.daysLeft}d left`}
                  </p>
                </div>
                <button
                  onClick={() => setWithdrawTarget(e)}
                  className="shrink-0 px-3 py-1.5 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50"
                >
                  Withdraw
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Withdraw modal ── */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Withdraw from {withdrawTarget.courseName}?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  This ends your access immediately and cannot be undone. There's no refund for remaining days.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="">Select a reason...</option>
                  {Object.entries(REASON_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Additional feedback (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Tell your tutor more about why you're leaving..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              {withdrawError && <p className="text-xs text-red-600">{withdrawError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setWithdrawTarget(null); setReason(''); setFeedback(''); setWithdrawError('') }}
                  className="flex-1 py-2.5 text-gray-600 border border-gray-200 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={submitWithdraw}
                  disabled={!reason || withdrawing}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {withdrawing && <Loader2 size={14} className="animate-spin" />}
                  {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}