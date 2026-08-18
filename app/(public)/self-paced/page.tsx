// app/(public)/self-paced/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Search, Layers, DollarSign } from 'lucide-react'

interface Course { _id: string; title: string; description: string; coverImageUrl: string | null; price: number; isFree: boolean; category: string; weekCount: number; tutorName: string }

export default function SelfPacedCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/self-paced/courses').then((r) => r.json()).then((d) => setCourses(d.courses || [])).finally(() => setLoading(false))
  }, [])

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Self-Paced Courses</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Learn at your own pace. Purchase once, study anytime.</p>
          </div>

          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          </div>

          {loading ? (
            <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">No courses available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((c) => (
                <Link key={c._id} href={`/self-paced/${c._id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-36 bg-gray-100">
                    {c.coverImageUrl ? <img src={c.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-8 h-8 text-gray-300" /></div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{c.title}</h3>
                    <p className="text-xs text-gray-400 mb-2">{c.tutorName} · {c.weekCount} week{c.weekCount !== 1 ? 's' : ''}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${c.isFree ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                      <DollarSign size={11} /> {c.isFree ? 'Free' : `₦${c.price.toLocaleString('en-NG')}`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}