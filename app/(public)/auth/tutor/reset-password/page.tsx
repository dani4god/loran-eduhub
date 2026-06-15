// app/(public)/auth/tutor/reset-password/page.tsx
import { Suspense } from 'react'
import TutorResetPasswordClient from './TutorResetPasswordClient'

export default function TutorResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TutorResetPasswordClient />
    </Suspense>
  )
}