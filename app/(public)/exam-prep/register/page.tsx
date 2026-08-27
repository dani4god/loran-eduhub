'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle2, Copy, AlertTriangle } from 'lucide-react'

export default function ExamPrepRegisterPage() {
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [school, setSchool] = useState('')
  const [subjects, setSubjects] = useState('')
  const [regNumber, setRegNumber] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!fullName.trim() || !location.trim() || !school.trim()) { setError('All fields are required'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/exam-prep/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, location, school, subjectsInterested: subjects.split(',').map((s) => s.trim()).filter(Boolean) }),
      })
      const data = await res.json()
      if (res.ok) setRegNumber(data.regNumber); else setError(data.error)
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          {regNumber ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-gray-900 mb-1">Registration Successful!</p>
              <p className="text-sm text-gray-500 mb-4">This is your registration number — you'll need it to log in.</p>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-blue-600">{regNumber}</span>
                <button onClick={() => navigator.clipboard.writeText(regNumber)}><Copy size={16} className="text-gray-400" /></button>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 mb-4">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Please keep this number saved somewhere safe — you'll need it every time you log in.</p>
              </div>
              <a href="/exam-prep/take" className="block w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold">Go to Exams →</a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h1 className="text-lg font-bold text-gray-900 mb-1">Register for Practice Exams</h1>
              <p className="text-sm text-gray-500 mb-5">Free JAMB, WAEC & NECO practice — takes less than a minute.</p>
              <div className="space-y-3">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (state/city)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Subjects of interest (comma separated)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button onClick={submit} disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">{submitting ? 'Registering...' : 'Register'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}