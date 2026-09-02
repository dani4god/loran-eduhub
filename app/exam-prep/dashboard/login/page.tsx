//app/exam-prep/login/page.tsx  
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [regNumber, setRegNumber] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/exam-prep/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regNumber, pin }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.replace('/exam-prep/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
        <ShieldCheck className="h-10 w-10 text-blue-600" />
        <h1 className="mt-4 text-2xl font-bold">Exam Prep Login</h1>
        <label className="mt-5 block text-xs font-semibold text-slate-600">Registration Number
          <input value={regNumber} onChange={(e) => setRegNumber(e.target.value.toUpperCase())} required className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold uppercase" />
        </label>
        <label className="mt-4 block text-xs font-semibold text-slate-600">6-Digit PIN
          <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required className="mt-1 w-full rounded-xl border px-3 py-2.5 text-center font-bold tracking-[0.3em]" />
        </label>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>}
        <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">{loading && <Loader2 size={15} className="animate-spin" />} Login</button>
        <p className="mt-5 text-center text-xs text-slate-500">New here? <Link href="/exam-prep/register" className="font-bold text-blue-600">Register</Link></p>
      </form>
    </div>
  )
}
