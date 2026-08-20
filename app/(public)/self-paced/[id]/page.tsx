// app/(public)/self-paced/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CoursePublicReviews from '@/components/self-paced/CoursePublicReviews'
import { Layers, Clock, HelpCircle, DollarSign, MessageSquare, Calendar, User } from 'lucide-react'

export default function SelfPacedCourseDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/self-paced/courses/${id}/public`).then((r) => r.json()).then(setCourse).finally(() => setLoading(false))
  }, [id])

  if (loading) return <><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div><Footer /></>
  if (!course || course.error) return <><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><p className="text-gray-400 text-sm">Course not found.</p></div><Footer /></>

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            <div className="h-48 sm:h-64 bg-gray-100">
              {course.coverImageUrl ? <img src={course.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-10 h-10 text-gray-300" /></div>}
            </div>
            <div className="p-5 sm:p-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 text-sm mb-4">{course.description}</p>
              <div className="flex items-center gap-3 mb-5">
                {course.tutor && (
                  <div className="flex items-center gap-2">
                    {course.tutor.profileImage ? <img src={course.tutor.profileImage} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><User size={14} className="text-blue-500" /></div>}
                    <span className="text-sm text-gray-700">{course.tutor.firstName} {course.tutor.lastName}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-lg font-bold ${course.isFree ? 'text-green-600' : 'text-blue-600'}`}>
                    {course.isFree ? 'Free' : `₦${course.price.toLocaleString('en-NG')}`}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">
                    Want to know more about this course? <a href="#reviews" className="text-blue-600 underline">See what students say</a> before you purchase.
                  </p>
                </div>
                <Link href={`/self-paced/${course._id}/purchase`} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                  {course.isFree ? 'Get This Course' : 'Purchase This Course'}
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Course Structure</h2>
            <p className="text-sm text-gray-500 mb-4">This course is self-paced, structured week by week. Each week unlocks after you pass the previous week's exam with 70% or higher.</p>
            <div className="space-y-2">
              {course.modules.map((m: any) => (
                <div key={m.weekNumber} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{m.weekNumber}</span>
                  <p className="flex-1 text-sm font-medium text-gray-800">{m.title}</p>
                  <span className="flex items-center gap-1 text-xs text-gray-400"><HelpCircle size={11} /> {m.questionCount}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} /> {m.durationMinutes}m</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course Reviews Section */}
          <div id="reviews" className="mb-6 scroll-mt-24">
            <CoursePublicReviews courseId={id} />
          </div>

          {(course.coachingEnabled || course.discordEnabled || course.weeklyWorkshop?.enabled) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {course.coachingEnabled && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <User size={18} className="text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-800">1-on-1 Coaching Available</p>
                </div>
              )}
              {course.discordEnabled && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <MessageSquare size={18} className="text-indigo-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-800">Discord Community Included</p>
                </div>
              )}
              {course.weeklyWorkshop?.enabled && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <Calendar size={18} className="text-purple-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-800">Free Weekly Workshop: {course.weeklyWorkshop.dayOfWeek} {course.weeklyWorkshop.time}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}