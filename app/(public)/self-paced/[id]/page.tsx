// app/(public)/self-paced/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CoursePublicReviews from '@/components/self-paced/CoursePublicReviews'
import PreviewVideoEmbed from '@/components/self-paced/PreviewVideoEmbed'
import { Layers, Clock, HelpCircle, MessageSquare, Calendar, User, Play, FileText } from 'lucide-react'

export default function SelfPacedCourseDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/self-paced/courses/${id}/public`).then((r) => r.json()).then(setCourse).finally(() => setLoading(false))
  }, [id])

  // Calculate total pages across all weeks
  const totalPages = course?.weeks?.reduce((acc: number, w: any) => acc + (w.pages?.length || 0), 0) || 0
  const totalQuestions = course?.weeks?.reduce((acc: number, w: any) => acc + (w.exam?.questions?.length || 0), 0) || 0

  // Build modules data with page titles for the outline
  const modules = course?.weeks?.map((week: any) => ({
    weekNumber: week.weekNumber,
    title: week.title,
    questionCount: week.exam?.questions?.length || 0,
    durationMinutes: week.exam?.durationMinutes || 0,
    pageTitles: week.pages?.map((p: any) => p.title || `Page ${week.pages.indexOf(p) + 1}`) || []
  })) || []

  if (loading) return <><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div><Footer /></>
  if (!course || course.error) return <><Navbar /><div className="min-h-screen flex items-center justify-center pt-16"><p className="text-gray-400 text-sm">Course not found.</p></div><Footer /></>

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Hero Card */}
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className={`text-lg font-bold ${course.isFree ? 'text-green-600' : 'text-blue-600'}`}>
                    {course.isFree ? 'Free' : `₦${course.price.toLocaleString('en-NG')}`}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">
                    Want to know more about this course? <a href="#reviews" className="text-blue-600 underline">See what students say</a> before you purchase.
                  </p>
                </div>
                <Link href={`/self-paced/${course._id}/purchase`} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0">
                  {course.isFree ? 'Get This Course' : 'Purchase This Course'}
                </Link>
              </div>
            </div>
          </div>

          {/* Preview Video Card (if video URL exists) */}
          {course.previewVideoUrl && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Play size={18} className="text-blue-600" /> Course Preview
              </h2>
              <PreviewVideoEmbed url={course.previewVideoUrl} />
            </div>
          )}

          {/* Table of Contents Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">What's Inside This Course</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 pb-5 border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{course.weeks?.length || 0}</p>
                <p className="text-xs text-gray-500">Weeks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalPages}</p>
                <p className="text-xs text-gray-500">Pages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{course.weeks?.length || 0}</p>
                <p className="text-xs text-gray-500">Exams</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">This course is self-paced, structured week by week. Each week unlocks after you pass the previous week's exam with 70% or higher.</p>
            
            <div className="space-y-3">
              {course.weeks?.map((week: any) => {
                const weekPageCount = week.pages?.length || 0
                const weekQuestionCount = week.exam?.questions?.length || 0
                return (
                  <div key={week._id || week.weekNumber} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {week.weekNumber}
                          </span>
                          <h3 className="text-sm font-semibold text-gray-800 truncate">{week.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 ml-8 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText size={11} /> {weekPageCount} page{weekPageCount !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle size={11} /> {weekQuestionCount} question{weekQuestionCount !== 1 ? 's' : ''}
                          </span>
                          {week.exam?.durationMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {week.exam.durationMinutes}m exam
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {weekPageCount} page{weekPageCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {week.pages?.length > 0 && (
                      <div className="mt-2 ml-8 space-y-1">
                        {week.pages.map((page: any, idx: number) => (
                          <div key={page._id || idx} className="flex items-center gap-1.5 text-xs text-gray-400 pl-2">
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>Page {idx + 1}: {page.title || `Page ${idx + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Course Outline (updated with page titles) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Course Outline</h2>
            <p className="text-sm text-gray-500 mb-4">This course is self-paced, structured week by week. Each week unlocks after you pass the previous week's exam with 70% or higher.</p>
            <div className="space-y-3">
              {modules.map((m: any) => (
                <div key={m.weekNumber} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{m.weekNumber}</span>
                    <p className="flex-1 text-sm font-semibold text-gray-800">{m.title}</p>
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0"><HelpCircle size={11} /> {m.questionCount}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0"><Clock size={11} /> {m.durationMinutes}m</span>
                  </div>
                  {m.pageTitles?.length > 0 && (
                    <ul className="pl-10 space-y-1">
                      {m.pageTitles.map((pt: string, i: number) => (
                        <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" /> {pt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Course Reviews Section */}
          <div id="reviews" className="mb-6 scroll-mt-24">
            <CoursePublicReviews courseId={id} />
          </div>

          {/* Extras (Coaching, Discord, Workshop) */}
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