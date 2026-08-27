// components/admin/ExamPrepManager.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Lock, Unlock, DollarSign, Users, Save, Loader2 } from 'lucide-react'

interface Plan { duration: string; price: number; enabled: boolean }
interface ExamPrepStudentRow {
  _id: string; regNumber: string; fullName: string; location: string; school: string;
  subjectsInterested: string[]; accessType: string; createdAt: string
}

const DURATION_LABELS: Record<string, string> = { '1month': '1 Month', '2months': '2 Months', '3months': '3 Months', life: 'Lifetime' }

export default function ExamPrepManager() {
  const [tab, setTab] = useState<'settings' | 'students'>('settings')
  const [isLocked, setIsLocked] = useState(true)
  const [isPaid, setIsPaid] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<ExamPrepStudentRow[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  useEffect(() => {
    fetch('/api/admin/exam-prep/settings').then((r) => r.json()).then((d) => {
      setIsLocked(d.settings.isLocked); setIsPaid(d.settings.isPaid); setPlans(d.settings.plans || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab !== 'students') return
    fetch('/api/admin/exam-prep/students').then((r) => r.json()).then((d) => setStudents(d.students || [])).finally(() => setLoadingStudents(false))
  }, [tab])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/exam-prep/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked, isPaid, plans }),
      })
      if (res.ok) toast.success('Settings updated')
      else toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const updatePlanPrice = (duration: string, price: number) => {
    setPlans(plans.map((p) => (p.duration === duration ? { ...p, price } : p)))
  }
  const togglePlanEnabled = (duration: string) => {
    setPlans(plans.map((p) => (p.duration === duration ? { ...p, enabled: !p.enabled } : p)))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Practice Exams</h1>
        <p className="text-gray-500 text-sm mt-0.5">Control access and pricing for JAMB/WAEC/NECO practice exams.</p>
      </div>

      <div className="flex gap-1.5">
        <button onClick={() => setTab('settings')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${tab === 'settings' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>Settings</button>
        <button onClick={() => setTab('students')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${tab === 'students' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>Registered Students</button>
      </div>

      {tab === 'settings' ? (
        loading ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">{isLocked ? <Lock size={16} className="text-red-500" /> : <Unlock size={16} className="text-green-500" />} Exam Access</p>
                <button
                  onClick={() => setIsLocked(!isLocked)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold ${isLocked ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {isLocked ? 'Locked — Click to Unlock' : 'Unlocked — Click to Lock'}
                </button>
              </div>
              <p className="text-xs text-gray-500">When locked, no student can take any practice exam, regardless of subscription.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2"><DollarSign size={16} className="text-blue-500" /> Pricing Mode</p>
                <button
                  onClick={() => setIsPaid(!isPaid)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold ${isPaid ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {isPaid ? 'Paid' : 'Free'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Free/Paid only applies to students registering AFTER this change — existing students keep the access
                terms they registered under.
              </p>
            </div>

            {isPaid && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">Subscription Plans</p>
                <div className="space-y-2">
                  {plans.map((p) => (
                    <div key={p.duration} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 w-32 shrink-0">
                        <input type="checkbox" checked={p.enabled} onChange={() => togglePlanEnabled(p.duration)} />
                        <span className="text-sm text-gray-700">{DURATION_LABELS[p.duration]}</span>
                      </label>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                        <input
                          type="number" min={0} value={p.price}
                          onChange={(e) => updatePlanPrice(p.duration, Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={saveSettings} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Settings
            </button>
          </div>
        )
      ) : (
        loadingStudents ? <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {students.length === 0 ? <p className="text-center text-gray-400 text-sm py-10">No registrations yet.</p> : students.map((s) => (
              <div key={s._id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{s.fullName}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0">{s.accessType}</span>
                </div>
                <p className="text-xs text-gray-400 font-mono mb-1">{s.regNumber}</p>
                <p className="text-xs text-gray-500">{s.school} · {s.location}</p>
                {s.subjectsInterested.length > 0 && <p className="text-xs text-gray-400 mt-1">Interested in: {s.subjectsInterested.join(', ')}</p>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}