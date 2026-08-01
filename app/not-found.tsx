// app/not-found.tsx
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Home, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-md">
          <p className="font-heading font-bold text-7xl sm:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
            404
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">Page Not Found</h1>
          <p className="text-gray-400 text-sm sm:text-base mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors">
              <Home size={16} /> Back Home
            </Link>
            <Link href="/tutors" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors">
              <Compass size={16} /> Browse Tutors
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}