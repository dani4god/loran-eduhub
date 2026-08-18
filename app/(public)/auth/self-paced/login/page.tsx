'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function SelfPacedLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true); setError('')
    const res = await signIn('credentials', { email, password, role: 'selfpaced_student', redirect: false })
    if (res?.error) setError(res.error)
    else router.push('/dashboard/self-paced')
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-4">Self-Paced Student Login</h1>
          <div className="space-y-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button onClick={submit} disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{loading ? 'Logging in...' : 'Log In'}</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}