//app/exam-prep/dashboard/register/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [catalog, setCatalog] = useState<any[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [form, setForm] = useState({ fullName: '', email: '', location: '', school: '', pin: '', confirmPin: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [regNumber, setRegNumber] = useState('')

  useEffect(() => {
    fetch('/api/exam-prep/subjects').then(r => r.json()).then(d => setCatalog(d.categories || []))
  }, [])

  const toggle = (subject: string) => {
    setSubjects((current) => current.includes(subject) ? current.filter((x) => x !== subject) : [...current, subject])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.pin !== form.confirmPin) return setError('PINs do not match.')
    if (!/^\d{6}$/.test(form.pin)) return setError('PIN must contain exactly 6 digits.')

    setLoading(true)
    try {
      const res = await fetch('/api/exam-prep/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subjectsInterested: subjects }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRegNumber(data.regNumber)
    } catch (error: any) {
      setError(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (regNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-sm">
          <Check className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-2xl font-bold">Registration Complete</h1>
          <p className="mt-2 text-sm text-slate-500">Save this registration number:</p>
          <div className="mt-4 rounded-2xl bg-slate-950 p-4 font-mono text-xl font-black text-white">{regNumber}</div>
          <button onClick={() => router.replace('/exam-prep/dashboard')} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">Continue</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 rounded-3xl border bg-white p-6 shadow-sm">
        <div><h1 className="text-2xl font-bold">Join Loran Exam Prep</h1><p className="mt-1 text-sm text-slate-500">Practice, compete and receive AI performance coaching.</p></div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['fullName', 'Full Name', 'text'], ['email', 'Email', 'email'], ['location', 'Location', 'text'], ['school', 'School', 'text'],
          ].map(([key, label, type]) => (
            <label key={key} className="text-xs font-semibold text-slate-600">{label}
              <input type={type} required value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600">Subjects of interest</p>
          <div className="mt-3 space-y-4">
            {catalog.map((cat) => (
              <div key={cat.value}>
                <p className="mb-2 text-[10px] font-bold uppercase text-slate-400">{cat.label}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.subjects.map((subject: string) => (
                    <button type="button" key={subject} onClick={() => toggle(subject)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${subjects.includes(subject) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200'}`}>{subject}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">6-Digit PIN
            <input type="password" inputMode="numeric" maxLength={6} required value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-center font-bold tracking-[0.3em]" />
          </label>
          <label className="text-xs font-semibold text-slate-600">Confirm PIN
            <input type="password" inputMode="numeric" maxLength={6} required value={form.confirmPin} onChange={(e) => setForm({ ...form, confirmPin: e.target.value.replace(/\D/g, '') })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-center font-bold tracking-[0.3em]" />
          </label>
        </div>

        {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">{loading && <Loader2 size={15} className="animate-spin" />} Register</button>
        <p className="text-center text-xs text-slate-500">Already registered? <Link href="/exam-prep/login" className="font-bold text-blue-600">Log in</Link></p>
      </form>
    </div>
  )
}

