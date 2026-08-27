// app/(public)/page.tsx
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdCorner from '@/components/home/AdCorner'
import HeroBackgroundSlider from '@/components/home/HeroBackgroundSlider'
import {
  ShieldCheck, Clock, TrendingUp, Users, FileQuestion, CreditCard,
  ArrowRight, ScrollText, ClipboardList, Megaphone, Briefcase, Sparkles,
  Layers, FileText,
} from 'lucide-react'

const STATS = [
  { value: '500+', label: 'Active Students' },
  { value: '50+', label: 'Expert Tutors' },
  { value: '30+', label: 'Courses Available' },
  { value: '95%', label: 'Pass Rate' },
]

const FEATURES = [
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'Verified Expert Tutors', desc: 'Every tutor is reviewed and approved by our admin team before they can teach.' },
  { icon: <Clock className="w-5 h-5" />, title: 'Flexible Scheduling', desc: 'Learn at your own pace. Sessions are coordinated directly between you and your tutor.' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Track Your Progress', desc: 'See your grades, exam scores, and subscription status all in one clean dashboard.' },
  { icon: <Users className="w-5 h-5" />, title: 'Community Learning', desc: 'Join Discord servers with classmates, collaborate, and learn together in structured channels.' },
  { icon: <FileQuestion className="w-5 h-5" />, title: 'Exams & Assignments', desc: 'Tutors create online exams — MCQ, fill-in-the-gap, and true/false — with instant grading.' },
  { icon: <CreditCard className="w-5 h-5" />, title: 'Secure Payments', desc: 'Pay securely in Naira via Paystack. All transactions are encrypted and protected.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register & Choose a Tutor', desc: 'Create your account, browse verified tutors, and pick the one that fits your learning style and goals.' },
  { step: '02', title: 'Pick Your Plan', desc: 'Start with a free trial, then choose monthly, 3, 6, or 12-month access — priced by your chosen tutor.' },
  { step: '03', title: 'Learn on Discord', desc: 'Join your tutor\'s private Discord server. Attend live sessions, get assignments, and track your progress.' },
]

interface TutorCard {
  _id: string
  firstName: string
  lastName: string
  bio: string
  profileImage: string | null
  slug: string
  courses: { _id: string; name: string }[]
  rating?: { average: number; count: number }
}

interface SelfPacedCourseCard {
  _id: string
  title: string
  coverImageUrl: string | null
  price: number
  isFree: boolean
  tutorName: string
  weekCount: number
}

interface LessonNoteCard {
  _id: string
  title: string
  coverImageUrl: string | null
  price: number
  isFree: boolean
  tutorName: string
  subject: string
  studentClass: string
}

async function getFeaturedTutors(): Promise<TutorCard[]> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/tutors/all`, { cache: 'no-store' })
    const data = await res.json()
    return (data.tutors || []).slice(0, 6)
  } catch {
    return []
  }
}

async function getFeaturedSelfPacedCourses(): Promise<SelfPacedCourseCard[]> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/self-paced/courses`, { cache: 'no-store' })
    const data = await res.json()
    return (data.courses || []).slice(0, 3)
  } catch {
    return []
  }
}

async function getFeaturedLessonNotes(): Promise<LessonNoteCard[]> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/lesson-notes`, { cache: 'no-store' })
    const data = await res.json()
    // Filter only published notes and take first 3
    const published = (data.notes || []).filter((n: any) => n.status === 'published')
    return published.slice(0, 3)
  } catch {
    return []
  }
}

async function getHeroImages(): Promise<string[]> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/site-settings`, { cache: 'no-store' })
    const data = await res.json()
    return data.heroImageUrls || []
  } catch {
    return []
  }
}

function getInitials(first: string, last: string) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
}

export default async function HomePage() {
  const tutors = await getFeaturedTutors()
  const selfPacedCourses = await getFeaturedSelfPacedCourses()
  const lessonNotes = await getFeaturedLessonNotes()
  const heroImages = await getHeroImages()

  return (
    <>
      <Navbar />
      <AdCorner />
      <main className="bg-gray-950">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950/60 to-purple-950/40 pt-24 pb-14 sm:pt-28 sm:pb-16">
          <HeroBackgroundSlider images={heroImages} />

          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-72 sm:h-72 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-xs sm:text-sm font-medium">Now accepting new students</span>
            </div>

            <h1 className="font-heading font-bold text-3xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5">
              Learn From The Best.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                On Your Schedule.
              </span>
            </h1>

            <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect with verified expert tutors, take structured courses, sit online exams, and
              track your progress — all in one platform built for Nigerian students.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
              <Link
                href="/auth/student/register"
                className="px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-sm sm:text-base hover:bg-blue-500 transition-all hover:scale-105 shadow-lg shadow-blue-500/30 w-full sm:w-auto text-center"
              >
                Get Started as a Student
              </Link>
              <Link
                href="/auth/tutor/register"
                className="px-7 py-3.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl text-sm sm:text-base hover:bg-white/20 transition-all w-full sm:w-auto text-center"
              >
                Apply as a Tutor
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-heading font-bold text-xl sm:text-2xl text-white">{stat.value}</p>
                  <p className="text-white/50 text-xs sm:text-sm mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Why Loran EduHub</span>
              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3 mb-3">Everything You Need to Succeed</h2>
              <p className="text-gray-400 text-sm sm:text-base">A complete learning platform built for Nigerian students and tutors.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {FEATURES.map((feature, i) => (
                <div key={i} className="p-5 sm:p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-blue-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-white text-base mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-purple-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Simple Process</span>
              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">How It Works</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
              <div className="hidden lg:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-indigo-400/30" />
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 relative z-10">
                    <span className="font-heading font-bold text-lg text-blue-400">{step.step}</span>
                  </div>
                  <h3 className="font-heading font-bold text-white text-lg mb-2.5">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/auth/student/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-all hover:scale-105 text-sm sm:text-base">
                Start Your Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="py-14 sm:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 p-8 sm:p-12">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3.5 py-1.5 mb-5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  <span className="text-white/80 text-xs sm:text-sm font-medium">Fair, transparent pricing</span>
                </div>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-4">
                  Every Tutor Sets Their Own Price
                </h2>
                <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-7">
                  There's no fixed catalog price here. Each tutor sets what they charge for monthly,
                  3, 6, and 12-month plans — so you can compare tutors and choose the one that fits
                  your budget and learning goals. Start with a free trial before you commit to any plan.
                </p>
                <Link href="/tutors" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm">
                  Browse Tutors & Pricing <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURED TUTORS ── */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Our Educators</span>
                <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">Meet Our Tutors</h2>
              </div>
              <Link href="/tutors" className="inline-flex items-center gap-2 text-blue-400 font-semibold text-sm hover:gap-3 transition-all shrink-0">
                View All Tutors <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {tutors.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">New tutors are joining soon — check back shortly.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {tutors.map((tutor) => (
                  <div key={tutor._id} className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-blue-500/30 transition-all duration-300">
                    <div className="p-5 sm:p-6 flex items-center gap-4">
                      {tutor.profileImage ? (
                        <img src={tutor.profileImage} alt={tutor.firstName} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-300 font-heading font-bold text-lg shrink-0">
                          {getInitials(tutor.firstName, tutor.lastName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-white text-base truncate">{tutor.firstName} {tutor.lastName}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tutor.courses?.slice(0, 2).map((course) => (
                            <span key={course._id} className="text-[11px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                              {course.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                      <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">{tutor.bio || 'Experienced tutor on Loran EduHub.'}</p>
                      <Link href={`/tutors/${tutor.slug}`} className="inline-flex items-center gap-2 text-blue-400 font-semibold text-sm group-hover:gap-3 transition-all">
                        View Profile <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── SELF-PACED COURSES ── */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-purple-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Learn On Your Own Time</span>
                <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">Self-Paced Courses</h2>
                <p className="text-gray-400 text-sm mt-2 max-w-lg">
                  Purchase once, learn at your own pace — with weekly exams, optional 1-on-1 coaching, and a
                  certificate when you finish.
                </p>
              </div>
              <Link href="/self-paced" className="inline-flex items-center gap-2 text-blue-400 font-semibold text-sm hover:gap-3 transition-all shrink-0">
                Browse All Courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {selfPacedCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">New self-paced courses are coming soon — check back shortly.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {selfPacedCourses.map((course) => (
                  <Link
                    key={course._id}
                    href={`/self-paced/${course._id}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-purple-500/30 transition-all duration-300"
                  >
                    <div className="h-40 bg-white/5">
                      {course.coverImageUrl ? (
                        <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading font-bold text-white text-sm mb-1 truncate">{course.title}</h3>
                      <p className="text-gray-500 text-xs mb-3">{course.tutorName} · {course.weekCount} week{course.weekCount !== 1 ? 's' : ''}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${course.isFree ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-300'}`}>
                        {course.isFree ? 'Free' : `₦${course.price.toLocaleString('en-NG')}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="text-center mt-10">
              <Link
                href="/self-paced"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base"
              >
                Purchase a Self-Paced Course <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── LESSON NOTES SECTION ── */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-amber-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Instant Learning</span>
                <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">Lesson Notes</h2>
                <p className="text-gray-400 text-sm mt-2 max-w-lg">
                  Get instant access to high-quality lesson notes created by expert tutors — 
                  no enrollment required, just purchase and download.
                </p>
              </div>
              <Link href="/lesson-notes" className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm hover:gap-3 transition-all shrink-0">
                Browse All Notes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {lessonNotes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">New lesson notes are being added soon — check back shortly.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {lessonNotes.map((note) => (
                  <Link
                    key={note._id}
                    href={`/lesson-notes/${note._id}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-amber-500/30 transition-all duration-300"
                  >
                    <div className="h-40 bg-white/5">
                      {note.coverImageUrl ? (
                        <img src={note.coverImageUrl} alt={note.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading font-bold text-white text-sm mb-1 truncate">{note.title}</h3>
                      <p className="text-gray-500 text-xs mb-3">
                        {note.tutorName} · {note.subject || 'General'} · {note.studentClass || 'All levels'}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${note.isFree ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-300'}`}>
                        {note.isFree ? 'Free' : `₦${note.price.toLocaleString('en-NG')}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="text-center mt-10">
              <Link
                href="/lesson-notes"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base"
              >
                Browse Lesson Notes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── DISCORD + TUTOR TOOLING AD ── */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
              {/* Left: student-facing Discord description */}
              <div>
                <div className="w-14 h-14 bg-indigo-500/15 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </div>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-4">
                  Learning Happens on Discord
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                  Once enrolled, you're automatically added to your tutor's private Discord server —
                  live sessions, study groups, Q&A channels, and announcements, all in one place.
                </p>
                <ul className="space-y-3">
                  {[
                    'Auto-joined to your course server on enrollment',
                    'Roles updated automatically based on your plan',
                    'Announcements and class schedules delivered right to you',
                    'Study alongside classmates in the same course',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                      <svg className="w-4.5 h-4.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: tutor tooling advert */}
              <div className="rounded-3xl bg-gradient-to-br from-purple-600/15 to-indigo-600/15 border border-white/10 p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-5">
                  <Briefcase className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="font-heading font-bold text-white text-xl sm:text-2xl mb-3">
                  Built to Help Tutors Teach, Not Just Sell Courses
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Beyond Discord, every tutor gets a full teaching dashboard to actually manage
                  their students — not just enroll them.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: <FileQuestion className="w-4 h-4" />, title: 'Exams & Assignments', desc: 'Create MCQ, true/false, and fill-in-the-gap exams with instant auto-grading, plus manually graded assignments.' },
                    { icon: <ScrollText className="w-4 h-4" />, title: 'Certificates', desc: 'Issue verifiable certificates automatically calculated from each student\'s real performance.' },
                    { icon: <Megaphone className="w-4 h-4" />, title: 'Announcements', desc: 'Post class schedules and updates that reach students directly on their dashboard.' },
                    { icon: <ClipboardList className="w-4 h-4" />, title: 'Course Library', desc: 'Build structured, chapter-by-chapter course material students progress through at their own pace.' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">{f.icon}</div>
                      <div>
                        <p className="text-white text-sm font-semibold">{f.title}</p>
                        <p className="text-gray-400 text-xs leading-relaxed mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/auth/tutor/register" className="inline-flex items-center gap-2 mt-6 text-purple-300 font-semibold text-sm hover:gap-3 transition-all">
                  Apply as a Tutor <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── EXAM PREP ADVERT ── */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-indigo-600 to-purple-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">Free Practice Tests</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
              Preparing for Local &amp; International Exams?
            </h2>
            <p className="text-indigo-100 text-sm sm:text-lg mb-8 max-w-xl mx-auto">
              Take free JAMB, WAEC &amp; NECO practice questions and get up to speed — 
              completely free to start.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/exam-prep/register"
                className="px-7 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:scale-105 transition-all hover:shadow-lg"
              >
                Register for Exams
              </Link>
              <Link
                href="/exam-prep/take"
                className="px-7 py-3.5 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all hover:scale-105"
              >
                Take Free Practice Exams
              </Link>
            </div>
            <p className="text-indigo-200/70 text-xs mt-5">
              No credit card required. Start practicing instantly.
            </p>
          </div>
        </section>

        {/* ── SCHOLARSHIPS / JOB MARKET AD ── */}
        <section className="py-14 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 sm:p-10 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                </div>
                <div className="text-center lg:text-left">
                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-white mb-2">
                    Beyond the Classroom: Scholarships & Opportunities
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Loran EduHub connects students and tutors to scholarship listings, internships,
                    and job openings — surfaced right where your learning already happens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">Testimonials</span>
              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">What Our Students Say</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {[
                { name: 'Tunde Adeyemi', course: 'Mathematics', quote: 'I went from failing maths to scoring A1 in WAEC. My tutor\'s teaching style on Discord made everything click.', initials: 'TA' },
                { name: 'Blessing Okoro', course: 'English Language', quote: 'The free trial convinced me. After a few months, my essay writing improved tremendously.', initials: 'BO' },
                { name: 'Emeka Nwosu', course: 'Computer Science', quote: 'Being able to see my exam grades and assignment scores in the dashboard keeps me motivated to study harder.', initials: 'EN' },
              ].map((t, i) => (
                <div key={i} className="bg-white/[0.03] rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.course} Student</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}