// app/(public)/tutors/page.tsx
import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TutorsClient from './TutorsClient'

export default function PublicTutorsPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <Footer />
        </>
      }
    >
      <TutorsClient />
    </Suspense>
  )
}