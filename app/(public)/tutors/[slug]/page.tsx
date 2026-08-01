// app/(public)/tutors/[slug]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StarRating from '@/components/shared/StarRating'
import { BookOpen, ExternalLink, User, MessageSquare, ArrowRight } from 'lucide-react'

interface TutorPricing { monthly: number; threeMonths: number; sixMonths: number; oneYear: number }
interface Course { _id: string; name: string; category: string }
interface SocialLink { label: string; url: string }
interface Review { _id: string; rating: number; comment: string; studentDisplayName: string; courseName: string; createdAt: string }
interface CampaignMessage { message: string; createdAt: string }

export default function TutorProfilePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [tutor, setTutor] = useState<any>(null)
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [reviews, setReviews] = useState<Review[]>([])
  const [campaigns, setCampaigns] = useState<CampaignMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/tutors/slug/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setNotFound(true); return; }
        setTutor(d.tutor)
        setRating(d.rating)
        setReviews(d.reviews || [])
        setCampaigns(d.campaignMessages || [])
      })
      .finally(() => setLoading(false))
  }, [slug])

  const registerWithTutor = (course: Course) => {
    const selection = [{
      courseId: course._id,
      courseName: course.name,
      tutorId: tutor._id,
      tutorName: `${tutor.firstName} ${tutor.lastName}`,
      pricing: tutor.pricing,
    }]
    sessionStorage.setItem('courseTutorSelections', JSON.stringify(selection))
    router.push('/auth/student/register-details')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  if (notFound || !tutor) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 px-4">
          <p className="text-gray-400 text-sm">This tutor could not be found.</p>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {tutor.profileImage ? (
                <img src={tutor.profileImage} alt={tutor.firstName} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl shrink-0">
                  {tutor.firstName[0]}{tutor.lastName[0]}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{tutor.firstName} {tutor.lastName}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <StarRating value={Math.round(rating.average)} readOnly size={16} />
                  <span className="text-sm font-semibold text-gray-700">{rating.average.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({rating.count} review{rating.count !== 1 ? 's' : ''})</span>
                </div>
                <p className="text-gray-600 text-sm mt-3 leading-relaxed max-w-xl">{tutor.bio}</p>

                {tutor.socialLinks?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                    {tutor.socialLinks.map((link: SocialLink, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100"
                      >
                        <ExternalLink size={12} /> {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Courses + pricing + register */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Courses & Pricing</h2>
            <div className="space-y-3">
              {tutor.courses.map((course: Course) => (
                <div key={course._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={15} className="text-blue-500 shrink-0" />
                    <p className="text-sm font-semibold text-gray-900">{course.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    <span>₦{tutor.pricing?.monthly?.toLocaleString('en-NG')}/mo</span>
                    <span>₦{tutor.pricing?.threeMonths?.toLocaleString('en-NG')}/3mo</span>
                    <span>₦{tutor.pricing?.sixMonths?.toLocaleString('en-NG')}/6mo</span>
                    <span>₦{tutor.pricing?.oneYear?.toLocaleString('en-NG')}/yr</span>
                  </div>
                  <button
                    onClick={() => registerWithTutor(course)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Register with this Tutor <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign messages */}
          {campaigns.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Updates from {tutor.firstName}</h2>
              <div className="space-y-3">
                {campaigns.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{c.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {new Date(c.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-blue-500" />
              <h2 className="text-base font-bold text-gray-900">Student Reviews</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">{r.studentDisplayName}</span>
                      </div>
                      <StarRating value={r.rating} readOnly size={13} />
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{r.courseName}</p>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}