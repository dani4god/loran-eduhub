// app/(public)/about/page.tsx
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  GraduationCap, Users, MessageSquare, Globe2, Award, Briefcase,
  ShieldCheck, Sparkles, ArrowRight, CheckCircle2, DollarSign,
  BookOpen, Target, Rocket,
} from 'lucide-react'

const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK || '#'

const WHAT_WE_DO = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Tech & Language Courses',
    desc: 'From web development and data analysis to French, Mandarin, and more — practical skills taught by real practitioners.',
  },
  {
    icon: <Award className="w-5 h-5" />,
    title: 'Local & International Exam Prep',
    desc: 'WAEC, JAMB, NECO, IGCSE, and IELTS — structured courses built around the exact syllabus you\'ll be tested on.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'A Tutor Marketplace, Not a Lecture Hall',
    desc: 'Tutors set their own pricing per plan. Students compare tutors and pick the one that fits their budget, style, and goals.',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Learning Happens on Discord',
    desc: 'Every enrollment gets you into your tutor\'s private Discord server — live sessions, Q&A channels, and classmates.',
  },
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: 'Scholarships & Job Opportunities',
    desc: 'A built-in job market connecting students and tutors to scholarships, internships, and job openings as they open up.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Secure, Verified, Transparent',
    desc: 'Every tutor is reviewed and approved before they can teach. Payments are encrypted and processed via Paystack.',
  },
]

const STUDENT_STEPS = [
  { step: '01', title: 'Register', desc: 'Create your free account in under two minutes.' },
  { step: '02', title: 'Pick a Course & Tutor', desc: 'Browse verified tutors, compare pricing and reviews, choose who fits you best.' },
  { step: '03', title: 'Choose a Plan', desc: 'Start with a free trial, or go monthly, 3, 6, or 12 months.' },
  { step: '04', title: 'Learn on Discord', desc: 'Join your tutor\'s server, attend sessions, submit assignments, sit exams.' },
]

const TUTOR_STEPS = [
  { step: '01', title: 'Apply', desc: 'Submit your qualifications, a short video intro, and the courses you can teach.' },
  { step: '02', title: 'Get Approved', desc: 'Our admin team reviews every application before you go live.' },
  { step: '03', title: 'Set Your Pricing', desc: 'You decide what to charge per plan — monthly, 3, 6, or 12 months.' },
  { step: '04', title: 'Start Teaching', desc: 'Students enroll with you directly. Manage grades, exams, and certificates from your dashboard.' },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-blue-950 to-purple-950 pt-32 pb-20">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-brand-secondary/20 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span className="text-white/80 text-sm font-medium">Who we are</span>
            </div>
            <h1 className="font-heading font-bold text-3xl sm:text-5xl text-white leading-tight mb-5">
              Empowering Nigerian Learners,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                One Connection at a Time
              </span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Loran EduHub connects students with verified expert tutors, builds structured courses
              around real exams, and brings the whole experience to life inside our Discord community.
            </p>
          </div>
        </section>

        {/* ── WHAT WE DO ── */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-brand-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">What We Do</span>
              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-brand-dark mt-3">
                More Than a Course Platform
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {WHAT_WE_DO.map((item, i) => (
                <div
                  key={i}
                  className="p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-student-light text-student flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-brand-dark text-base mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AD: BECOME A TUTOR ── */}
        <section className="py-12 lg:py-16 bg-brand-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-10 lg:p-14 text-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
                  <DollarSign className="w-4 h-4 text-white" />
                  <span className="text-white text-xs sm:text-sm font-semibold">Now recruiting tutors</span>
                </div>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-4">
                  Set Your Own Price. Teach on Your Terms.
                </h2>
                <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
                  Unlike other platforms, Loran EduHub gives every tutor full control over what they
                  charge — monthly, 3, 6, or 12-month pricing, set by you.
                </p>
                <Link
                  href="/auth/tutor/register"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all hover:scale-105"
                >
                  Apply to Teach
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS: TWO TRACKS ── */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-brand-secondary font-semibold text-xs sm:text-sm uppercase tracking-wider">Getting Started</span>
              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-brand-dark mt-3">
                Two Ways to Join
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Students track */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-student-light text-student flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-dark text-lg sm:text-xl">For Students</h3>
                </div>
                <div className="space-y-5">
                  {STUDENT_STEPS.map((s, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="font-heading font-bold text-2xl text-student-light shrink-0">{s.step}</span>
                      <div>
                        <p className="font-semibold text-brand-dark text-sm">{s.title}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/student/register"
                  className="inline-flex items-center gap-2 mt-6 text-brand-primary font-semibold text-sm hover:gap-3 transition-all"
                >
                  Start Learning <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Tutors track */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-tutor-light text-tutor flex items-center justify-center shrink-0">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-dark text-lg sm:text-xl">For Tutors</h3>
                </div>
                <div className="space-y-5">
                  {TUTOR_STEPS.map((s, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="font-heading font-bold text-2xl text-tutor-light shrink-0">{s.step}</span>
                      <div>
                        <p className="font-semibold text-brand-dark text-sm">{s.title}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/tutor/register"
                  className="inline-flex items-center gap-2 mt-6 text-brand-primary font-semibold text-sm hover:gap-3 transition-all"
                >
                  Apply to Teach <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── DISCORD COMMUNITY ── */}
        <section className="py-16 lg:py-24 bg-indigo-600">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mb-4">
              Join the "Loran EduHub" Discord Community
            </h2>
            <p className="text-indigo-100 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              Every student and tutor becomes part of one connected Discord community. Beyond your
              course channels, it's where announcements, class schedules, study groups, and support
              all happen — in real time.
            </p>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-all hover:scale-105"
            >
              Join Our Discord Server
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* ── AD: JOB MARKET / SCHOLARSHIPS ── */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border-2 border-brand-primary/10 bg-gradient-to-br from-blue-50 to-purple-50 p-6 sm:p-10 lg:p-14">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-brand-primary/10 rounded-full px-4 py-1.5 mb-5">
                    <Briefcase className="w-4 h-4 text-brand-primary" />
                    <span className="text-brand-primary text-xs sm:text-sm font-semibold">Beyond the classroom</span>
                  </div>
                  <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-brand-dark mb-4">
                    Scholarships & Job Opportunities
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                    We connect our students and tutors to scholarship listings, internships, and job
                    openings — a built-in opportunity board that grows with our community.
                  </p>
                  <ul className="space-y-2.5 mb-6 text-left inline-block">
                    {[
                      'Scholarship listings for active students',
                      'Job openings shared with qualified tutors',
                      'Opportunities surfaced right in your Discord server',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Target className="w-12 h-12 sm:w-16 sm:h-16 text-brand-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-16 lg:py-24 bg-brand-dark">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg mb-8">
              Whether you're here to learn or to teach, Loran EduHub is built for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/student/register"
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                Get Started as a Student
              </Link>
              <Link
                href="/auth/tutor/register"
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                Apply as a Tutor
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}