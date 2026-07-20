// app/(public)/tutors/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Search, BookOpen } from 'lucide-react'
import { RatingSummaryBadge } from '@/components/shared/TutorReviewsPanel'
import TutorReviewsPanel from '@/components/shared/TutorReviewsPanel'

interface TutorPricing {
  monthly: number
  threeMonths: number
  sixMonths: number
  oneYear: number
}

interface Tutor {
  _id: string
  firstName: string
  lastName: string
  bio: string
  profileImage: string | null
  slug: string
  pricing: TutorPricing | null
  rating: { average: number; count: number }
  courses: { _id: string; name: string; category: string }[]
}

export default function PublicTutorsPage() {
  const router = useRouter()
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/tutors/all')
      .then(r => r.json())
      .then(d => setTutors(d.tutors || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tutors.filter(t => {
    const q = search.toLowerCase()
    return (
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
      t.courses.some(c => c.name.toLowerCase().includes(q))
    )
  })

  // Sends the user straight into the existing registration flow with this
  // exact tutor+course already chosen — skips course/tutor selection
  // entirely and lands on the payment/details step.
  const enrollWith = (tutor: Tutor, course: { _id: string; name: string }) => {
    const selection = [
      {
        courseId: course._id,
        courseName: course.name,
        tutorId: tutor._id,
        tutorName: `${tutor.firstName} ${tutor.lastName}`,
        pricing: tutor.pricing,
      },
    ]
    sessionStorage.setItem('courseTutorSelections', JSON.stringify(selection))
    router.push('/auth/student/register-details')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Tutors</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Browse verified expert tutors and read reviews from real students.
            </p>
          </div>

          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by tutor name or course..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No tutors found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(tutor => (
                <div
                  key={tutor._id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5 flex items-start gap-3">
                    {tutor.profileImage ? (
                      <img src={tutor.profileImage} alt={tutor.firstName} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-600 font-bold">
                          {tutor.firstName[0]}
                          {tutor.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-sm truncate">
                        {tutor.firstName} {tutor.lastName}
                      </h3>
                      <RatingSummaryBadge average={tutor.rating.average} count={tutor.rating.count} />
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <p className="text-xs text-gray-500 line-clamp-3 mb-3">{tutor.bio || 'Experienced tutor.'}</p>

                    <div className="space-y-1.5 mb-3">
                      {tutor.courses.map(course => (
                        <button
                          key={course._id}
                          onClick={() => enrollWith(tutor, course)}
                          className="w-full flex items-center justify-between gap-2 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 text-left transition-colors group"
                        >
                          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700 truncate">
                            <BookOpen size={12} className="text-blue-500 shrink-0" />
                            {course.name}
                          </span>
                          <span className="text-[11px] font-semibold text-blue-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            Enroll →
                          </span>
                        </button>
                      ))}
                    </div>

                    {tutor.pricing && (
                      <p className="text-[11px] text-gray-400 mb-3">
                        From ₦{tutor.pricing.monthly.toLocaleString('en-NG')}/mo
                      </p>
                    )}

                    <TutorReviewsPanel tutorId={tutor._id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}