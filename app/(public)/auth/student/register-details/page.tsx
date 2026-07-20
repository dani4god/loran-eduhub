'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PLAN_LABELS, PLAN_DURATIONS, PLAN_PRICING_KEY, PlanType } from '@/lib/constants'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
]

// Define plan IDs in order
const PLAN_IDS: PlanType[] = ['trial', 'monthly', '3months', '6months', '1year']

export default function RegisterDetailsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<any[]>([])
  const [plan, setPlan] = useState<PlanType>('trial')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const selections = sessionStorage.getItem('courseTutorSelections')
    if (!selections) {
      router.push('/auth/student/register')
      return
    }
    setSelectedCourses(JSON.parse(selections))
  }, [router])

  // Calculate total amount based on selected plan and courses
  const amountForPlan = (courses: any[], planId: PlanType): number => {
    if (planId === 'trial') return 0
    const key = PLAN_PRICING_KEY[planId]
    return courses.reduce((sum, c) => sum + (c.pricing?.[key] || 0), 0)
  }

  const totalAmount = amountForPlan(selectedCourses, plan)

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!formData.firstName.trim()) e.firstName = 'First name is required'
    if (!formData.lastName.trim()) e.lastName = 'Last name is required'
    if (!formData.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email'
    if (!formData.phone.trim()) e.phone = 'Phone number is required'
    if (!formData.state) e.state = 'Please select your state'
    if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required'
    if (!formData.password) e.password = 'Password is required'
    else if (formData.password.length < 6) e.password = 'Minimum 6 characters'
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    try {
      // ── Check if email is already registered ──
      const emailCheck = await fetch(
        `/api/students?email=${encodeURIComponent(formData.email.trim())}`
      )
      const emailData = await emailCheck.json()
      if (emailData.exists) {
        setErrors({ email: 'This email is already registered. Try logging in.' })
        setLoading(false)
        return
      }

      if (plan === 'trial') {
        // ── Trial: store registration data and create account directly ──
        const res = await fetch('/api/payments/verify/trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            state: formData.state,
            dateOfBirth: formData.dateOfBirth,
            plan: 'trial',
            selections: selectedCourses.map(s => ({
              courseId: s.courseId,
              tutorId: s.tutorId,
            })),
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Registration failed')

        sessionStorage.removeItem('courseTutorSelections')
        router.push('/dashboard/student?welcome=true')
        return
      }

      // ── Paid plan: store ALL registration data in sessionStorage ──
      // Password is stored temporarily — cleared immediately after account creation
      sessionStorage.setItem(
        'registrationIntent',
        JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          state: formData.state,
          dateOfBirth: formData.dateOfBirth,
          plan,
          // selections only need courseId/tutorId/courseName/tutorName
          // Pricing is not forwarded per-item (backend recomputes independently)
          selections: selectedCourses.map(s => ({
            courseId: s.courseId,
            tutorId: s.tutorId,
            courseName: s.courseName,
            tutorName: s.tutorName,
          })),
          amount: totalAmount, // sent for display purposes only — server recomputes independently
        })
      )

      router.push('/payment')
    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  // Get selected plan label for display
  const selectedPlanLabel = PLAN_LABELS[plan]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Registration</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your details to create your account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 08012345678"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State of Residence *</label>
                <select
                  value={formData.state}
                  onChange={e => setFormData(f => ({ ...f, state: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.state ? 'border-red-300' : 'border-gray-200'}`}
                >
                  <option value="">Select state...</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={e => setFormData(f => ({ ...f, dateOfBirth: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className={`w-full px-3 py-2.5 pr-16 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e => setFormData(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Re-enter your password"
                    className={`w-full px-3 py-2.5 pr-16 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Plan selection - Using PLAN_IDS from constants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan *</label>
                <div className="grid grid-cols-2 gap-3">
                  {PLAN_IDS.map(id => {
                    const amount = amountForPlan(selectedCourses, id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPlan(id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          plan === id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-900">{PLAN_LABELS[id]}</div>
                        <div className="text-sm font-bold text-blue-600 mt-0.5">
                          {id === 'trial' ? '₦0' : `₦${amount.toLocaleString('en-NG')}`}
                        </div>
                        <div className="text-xs text-gray-400">{PLAN_DURATIONS[id]} days</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-900 text-sm">Order Summary</p>
                <div className="space-y-1">
                  {selectedCourses.map(course => (
                    <p key={course.courseId} className="text-xs text-gray-500">
                      • {course.courseName}{' '}
                      <span className="text-gray-400">with {course.tutorName}</span>
                    </p>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{PLAN_LABELS[plan]}</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ₦{totalAmount.toLocaleString('en-NG')}
                  </span>
                </div>
                {plan !== 'trial' && selectedCourses.length > 1 && (
                  <div className="text-xs text-gray-500 text-right">
                    Includes all selected courses
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  {errors.submit}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Processing...'
                  : plan === 'trial'
                  ? 'Start Free Trial'
                  : `Continue to Payment — ₦${totalAmount.toLocaleString('en-NG')}`}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}