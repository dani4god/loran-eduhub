import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle2 } from 'lucide-react'

export default function PurchaseSuccessPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-sm">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">You're In!</h1>
          <p className="text-sm text-gray-500 mb-6">Your course has been added to your account. Log in to start learning.</p>
          <Link href="/auth/self-paced/login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Log In</Link>
        </div>
      </div>
      <Footer />
    </>
  )
}