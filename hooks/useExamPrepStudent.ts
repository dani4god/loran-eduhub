//app/hooks/useExamPrepStudent.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useExamPrepStudent() {
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/exam-prep/me', { cache: 'no-store' })
      if (res.status === 401) {
        router.replace('/exam-prep/login')
        return
      }
      const data = await res.json()
      setStudent(data.student || null)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { refresh() }, [refresh])

  const logout = async () => {
    await fetch('/api/exam-prep/logout', { method: 'POST' })
    router.replace('/exam-prep/login')
    router.refresh()
  }

  return { student, loading, refresh, logout }
}
