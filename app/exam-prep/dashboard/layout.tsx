'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ExamPrepSidebar from '@/components/examprep/ExamPrepSidebar'

export default function ExamPrepDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const reg = localStorage.getItem('examPrepRegNumber')
    if (!reg) { router.push('/exam-prep/take'); return }
    setChecked(true)
  }, [])

  if (!checked) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <ExamPrepSidebar />
      <div className="lg:pl-60 pt-16 lg:pt-0">{children}</div>
    </div>
  )
}