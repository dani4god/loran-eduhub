// app/maintenance/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Wrench } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center mx-auto mb-5">
            <Wrench className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">We'll Be Right Back</h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Loran EduHub is currently undergoing scheduled maintenance. We're working to improve
            your experience and will be back online shortly.
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}