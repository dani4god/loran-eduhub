import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ── Mock tutor data (replace with real API fetch) ──
const FEATURED_TUTORS = [
  { id: '1', name: 'Dr. Amara Okafor', slug: 'amara-okafor', courses: ['Mathematics', 'Physics'], bio: 'PhD in Applied Mathematics with 10 years of teaching experience.', image: null, initials: 'AO', color: 'bg-blue-500' },
  { id: '2', name: 'Mrs. Ngozi Adeyemi', slug: 'ngozi-adeyemi', courses: ['English Language', 'Literature'], bio: 'MA English Literature, specialist in WAEC & JAMB preparation.', image: null, initials: 'NA', color: 'bg-purple-500' },
  { id: '3', name: 'Engr. Chidi Nwosu', slug: 'chidi-nwosu', courses: ['Further Maths', 'Computer Science'], bio: 'Software engineer turned educator, passionate about STEM.', image: null, initials: 'CN', color: 'bg-green-500' },
  { id: '4', name: 'Mrs. Fatima Bello', slug: 'fatima-bello', courses: ['Chemistry', 'Biology'], bio: 'BSc Biochemistry, 8 years helping students ace science subjects.', image: null, initials: 'FB', color: 'bg-rose-500' },
  { id: '5', name: 'Mr. Seun Okonkwo', slug: 'seun-okonkwo', courses: ['Economics', 'Government'], bio: 'MSc Economics, former NECO examiner and curriculum developer.', image: null, initials: 'SO', color: 'bg-amber-500' },
  { id: '6', name: 'Dr. Kemi Afolabi', slug: 'kemi-afolabi', courses: ['French', 'Yoruba Language'], bio: 'Language expert with international teaching certifications.', image: null, initials: 'KA', color: 'bg-teal-500' },
]

const STATS = [
  { value: '500+', label: 'Active Students' },
  { value: '50+', label: 'Expert Tutors' },
  { value: '30+', label: 'Courses Available' },
  { value: '95%', label: 'Pass Rate' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Register & Choose a Tutor',
    desc: 'Create your account, browse our verified tutors, and pick the one that fits your learning style and goals.',
    color: 'bg-student-light text-student',
  },
  {
    step: '02',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Pick Your Plan',
    desc: 'Start with a free 1-week trial or choose a 3-month, 6-month, or 1-year diploma plan that suits your budget.',
    color: 'bg-tutor-light text-tutor',
  },
  {
    step: '03',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Learn on Discord',
    desc: 'Join your tutor\'s private Discord server. Attend live sessions, get assignments, and track your progress.',
    color: 'bg-indigo-50 text-indigo-600',
  },
]

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Verified Expert Tutors',
    desc: 'Every tutor is reviewed and approved by our admin team before they can teach.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Flexible Scheduling',
    desc: 'Learn at your own pace. Sessions are coordinated directly between you and your tutor.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Track Your Progress',
    desc: 'See your grades, exam scores, and subscription status all in one clean dashboard.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Community Learning',
    desc: 'Join Discord servers with classmates, collaborate, and learn together in structured channels.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Exams & Assignments',
    desc: 'Tutors create online exams — MCQ, fill-in-the-gap, and true/false — with instant grading.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure Payments',
    desc: 'Pay securely in Naira via Paystack. All transactions are encrypted and protected.',
  },
]

const PLANS = [
  { id: 'trial', label: '1 Week Free Trial', price: '₦0', duration: '7 days', highlight: false, tag: null },
  { id: '3months', label: '3 Months', price: '₦45,000', duration: '90 days', highlight: false, tag: null },
  { id: '6months', label: '6 Months', price: '₦80,000', duration: '180 days', highlight: true, tag: 'Most Popular' },
  { id: '1year', label: '1 Year Diploma', price: '₦150,000', duration: '365 days', highlight: false, tag: 'Best Value' },
]

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* ── HERO SECTION ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-dark via-blue-950 to-purple-950 pt-20">
          {/* Background grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-secondary/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Now accepting new students</span>
            </div>

            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-7xl text-white leading-tight mb-6">
              Learn From The Best.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                On Your Schedule.
              </span>
            </h1>

            <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect with verified expert tutors, take structured courses, sit online exams, and track your progress — all in one platform built for Nigerian students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/auth/student/register"
                className="px-8 py-4 bg-brand-primary text-white font-semibold rounded-xl text-base hover:bg-blue-600 transition-all hover:scale-105 shadow-lg shadow-blue-500/30 w-full sm:w-auto text-center"
              >
                Get Started as a Student
              </Link>
              <Link
                href="/auth/tutor/register"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl text-base hover:bg-white/20 transition-all w-full sm:w-auto text-center"
              >
                Apply as a Tutor
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-heading font-bold text-3xl text-white">{stat.value}</p>
                  <p className="text-white/50 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
          </div>
        </section>

        {/* ── FEATURES SECTION ── */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-brand-primary font-semibold text-sm uppercase tracking-wider">Why Loran EduHub</span>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-brand-dark mt-3 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-gray-500 text-lg">
                A complete learning platform designed specifically for Nigerian students and tutors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-gray-100 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-student-light text-student flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-brand-dark text-base mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-20 lg:py-28 bg-brand-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-brand-secondary font-semibold text-sm uppercase tracking-wider">Simple Process</span>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-brand-dark mt-3 mb-4">
                How It Works
              </h2>
              <p className="text-gray-500 text-lg">
                From registration to your first lesson in three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
              {/* Connector line (desktop only) */}
              <div className="hidden lg:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-brand-primary/30 via-brand-secondary/30 to-indigo-400/30" />

              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-6 relative z-10`}>
                    {step.icon}
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-dark text-white text-xs font-bold flex items-center justify-center font-heading">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-brand-dark text-xl mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/auth/student/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:scale-105"
              >
                Start Your Free Trial
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FEATURED TUTORS ── */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-brand-primary font-semibold text-sm uppercase tracking-wider">Our Educators</span>
                <h2 className="font-heading font-bold text-3xl lg:text-4xl text-brand-dark mt-3">
                  Meet Some of Our Tutors
                </h2>
              </div>
              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 text-brand-primary font-semibold text-sm hover:gap-3 transition-all shrink-0"
              >
                View All Tutors
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_TUTORS.map((tutor) => (
                <div
                  key={tutor.id}
                  className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${tutor.color} flex items-center justify-center text-white font-heading font-bold text-lg shrink-0`}>
                      {tutor.initials}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-brand-dark text-base">{tutor.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tutor.courses.map((course) => (
                          <span key={course} className="text-xs bg-student-light text-student px-2 py-0.5 rounded-full font-medium">
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{tutor.bio}</p>
                    <Link
                      href={`/tutors/${tutor.slug}`}
                      className="inline-flex items-center gap-2 text-brand-primary font-semibold text-sm group-hover:gap-3 transition-all"
                    >
                      View Profile
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-brand-primary text-brand-primary font-semibold rounded-xl hover:bg-student-light transition-all"
              >
                View Our Tutors
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── PRICING PREVIEW ── */}
        <section className="py-20 lg:py-28 bg-brand-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">Pricing</span>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mt-3 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-400 text-lg">
                All prices in Nigerian Naira. Start free, upgrade anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 border transition-all ${
                    plan.highlight
                      ? 'bg-brand-primary border-brand-primary shadow-xl shadow-blue-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  {plan.tag && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${
                      plan.highlight ? 'bg-brand-accent text-white' : 'bg-white/20 text-white'
                    }`}>
                      {plan.tag}
                    </span>
                  )}
                  <p className="text-white/60 text-sm mb-2">{plan.label}</p>
                  <p className="font-heading font-bold text-3xl text-white mb-1">{plan.price}</p>
                  <p className="text-white/40 text-xs mb-6">{plan.duration}</p>
                  <Link
                    href="/auth/student/register"
                    className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-white text-brand-primary hover:bg-blue-50'
                        : 'border border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DISCORD SECTION ── */}
        <section className="py-20 lg:py-28 bg-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </div>
                <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">
                  Learning Happens on Discord
                </h2>
                <p className="text-indigo-100 text-lg leading-relaxed mb-6">
                  Once enrolled, you'll be automatically added to your tutor's private Discord server. Live sessions, study groups, Q&A channels, and assignment submissions — all in one place.
                </p>
                <ul className="space-y-3">
                  {[
                    'Auto-joined to your course server on enrollment',
                    'Roles updated automatically based on your plan',
                    'Subscription status synced in real-time',
                    'Study alongside classmates in the same course',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-indigo-100">
                      <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 w-full">
                {/* Discord UI mockup */}
                <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="flex">
                    {/* Sidebar */}
                    <div className="w-16 bg-gray-900 py-4 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                        <span className="text-white font-bold text-xs">L</span>
                      </div>
                      <div className="w-8 h-px bg-white/10" />
                      {['bg-green-500', 'bg-purple-500', 'bg-blue-500'].map((c, i) => (
                        <div key={i} className={`w-10 h-10 rounded-2xl ${c} hover:rounded-xl transition-all`} />
                      ))}
                    </div>
                    {/* Channel list */}
                    <div className="w-40 bg-gray-800 py-4 px-3">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Mathematics</p>
                      {['# general', '# assignments', '# q-and-a', '# announcements'].map((ch) => (
                        <div key={ch} className={`px-2 py-1.5 rounded text-sm mb-0.5 ${ch === '# general' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                          {ch}
                        </div>
                      ))}
                    </div>
                    {/* Chat */}
                    <div className="flex-1 py-4 px-4 space-y-4">
                      {[
                        { user: 'Dr. Amara', msg: 'Good morning class! Today we cover quadratic equations.', color: 'bg-blue-500' },
                        { user: 'Chidi S.', msg: 'Good morning sir! Ready to learn 🎓', color: 'bg-green-500' },
                        { user: 'Dr. Amara', msg: 'Check #assignments for today\'s worksheet.', color: 'bg-blue-500' },
                      ].map((m, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-8 h-8 rounded-full ${m.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {m.user[0]}
                          </div>
                          <div>
                            <p className="text-white text-xs font-semibold mb-0.5">{m.user}</p>
                            <p className="text-gray-300 text-xs">{m.msg}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-20 lg:py-28 bg-brand-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-brand-primary font-semibold text-sm uppercase tracking-wider">Testimonials</span>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-brand-dark mt-3">
                What Our Students Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Tunde Adeyemi', course: 'Mathematics', quote: 'I went from failing maths to scoring A1 in WAEC. Dr. Amara\'s teaching style on Discord made everything click.', initials: 'TA', color: 'bg-blue-500' },
                { name: 'Blessing Okoro', course: 'English Language', quote: 'The free trial convinced me. After 3 months with Mrs. Ngozi, my essay writing improved tremendously.', initials: 'BO', color: 'bg-purple-500' },
                { name: 'Emeka Nwosu', course: 'Computer Science', quote: 'Being able to see my exam grades and assignment scores in the dashboard keeps me motivated to study harder.', initials: 'EN', color: 'bg-green-500' },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-brand-accent fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark text-sm">{t.name}</p>
                      <p className="text-gray-400 text-xs">{t.course} Student</p>
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