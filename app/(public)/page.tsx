// app/(public)/page.tsx

import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdCorner from "@/components/home/AdCorner";
import HeroBackgroundSlider from "@/components/home/HeroBackgroundSlider";

import {
  ShieldCheck,
  Clock,
  TrendingUp,
  Users,
  FileQuestion,
  CreditCard,
  ArrowRight,
  ScrollText,
  ClipboardList,
  Megaphone,
  Briefcase,
  Sparkles,
  Layers,
  FileText,
  BookOpen,
  GraduationCap,
  Trophy,
  CheckCircle2,
  PlayCircle,
  Download,
  BrainCircuit,
  ChevronRight,
} from "lucide-react";

// ============================================================
// STATS
// ============================================================

const STATS = [
  {
    value: "500+",
    label: "Active Students",
  },
  {
    value: "50+",
    label: "Expert Tutors",
  },
  {
    value: "30+",
    label: "Courses Available",
  },
  {
    value: "95%",
    label: "Pass Rate",
  },
];

// ============================================================
// FEATURES
// ============================================================

const FEATURES = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Verified Expert Tutors",
    desc:
      "Every tutor is reviewed and approved by our admin team before they can teach.",
  },

  {
    icon: <Clock className="w-5 h-5" />,
    title: "Flexible Scheduling",
    desc:
      "Learn at your own pace. Sessions are coordinated directly between you and your tutor.",
  },

  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Track Your Progress",
    desc:
      "See your grades, exam scores, course progress, and subscription status from one dashboard.",
  },

  {
    icon: <Users className="w-5 h-5" />,
    title: "Community Learning",
    desc:
      "Join structured Discord communities, collaborate with classmates, and stay connected to your tutor.",
  },

  {
    icon: <FileQuestion className="w-5 h-5" />,
    title: "Exams & Assignments",
    desc:
      "Take online assessments including MCQ, fill-in-the-gap, true/false questions and tutor-graded assignments.",
  },

  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Secure Payments",
    desc:
      "Pay securely in Naira through Paystack for tutoring, courses, coaching and premium learning resources.",
  },
];

// ============================================================
// HOW IT WORKS
// ============================================================

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose How You Want to Learn",
    desc:
      "Find a tutor, purchase a self-paced course, get lesson notes or start practising for your examination.",
  },

  {
    step: "02",
    title: "Start Learning",
    desc:
      "Access structured lessons, course materials, assessments and learning communities from your dashboard.",
  },

  {
    step: "03",
    title: "Track Your Progress",
    desc:
      "Monitor your scores, complete assessments, receive feedback and work towards your learning goals.",
  },
];

// ============================================================
// TYPES
// ============================================================

interface TutorCard {
  _id: string;

  firstName: string;
  lastName: string;

  bio: string;

  profileImage: string | null;

  slug: string;

  courses: {
    _id: string;
    name: string;
  }[];

  rating?: {
    average: number;
    count: number;
  };
}

interface SelfPacedCourseCard {
  _id: string;

  title: string;

  coverImageUrl: string | null;

  price: number;

  isFree: boolean;

  tutorName: string;

  weekCount: number;
}

interface LessonNoteCard {
  _id: string;

  title: string;

  description?: string;

  coverImageUrl: string | null;

  price: number;

  isFree: boolean;

  tutorName: string;

  subject: string;

  studentClass: string;

  category?: string | null;

  weekCount: number;

  purchaseCount: number;
}

// ============================================================
// FETCH FEATURED TUTORS
// ============================================================

async function getFeaturedTutors(): Promise<TutorCard[]> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/tutors/all`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(
        "Failed to fetch tutors:",
        res.status
      );

      return [];
    }

    const data = await res.json();

    const tutors = Array.isArray(data.tutors)
      ? data.tutors
      : [];

    return tutors.slice(0, 6);
  } catch (error) {
    console.error(
      "Homepage tutors fetch error:",
      error
    );

    return [];
  }
}

// ============================================================
// FETCH FEATURED SELF-PACED COURSES
// ============================================================

async function getFeaturedSelfPacedCourses(): Promise<
  SelfPacedCourseCard[]
> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/self-paced/courses`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(
        "Failed to fetch self-paced courses:",
        res.status
      );

      return [];
    }

    const data = await res.json();

    const courses = Array.isArray(data.courses)
      ? data.courses
      : [];

    return courses.slice(0, 3);
  } catch (error) {
    console.error(
      "Homepage self-paced courses fetch error:",
      error
    );

    return [];
  }
}

// ============================================================
// FETCH FEATURED PUBLISHED LESSON NOTES
// ============================================================

async function getFeaturedLessonNotes(): Promise<
  LessonNoteCard[]
> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/lesson-notes`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(
        "Failed to fetch lesson notes:",
        res.status
      );

      return [];
    }

    const data = await res.json();

    const notes = Array.isArray(data.notes)
      ? data.notes
      : [];

    return notes.slice(0, 3);
  } catch (error) {
    console.error(
      "Homepage lesson notes fetch error:",
      error
    );

    return [];
  }
}

// ============================================================
// FETCH HERO IMAGES
// ============================================================

async function getHeroImages(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/site-settings`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(
        "Failed to fetch hero images:",
        res.status
      );

      return [];
    }

    const data = await res.json();

    return Array.isArray(data.heroImageUrls)
      ? data.heroImageUrls
      : [];
  } catch (error) {
    console.error(
      "Homepage hero images fetch error:",
      error
    );

    return [];
  }
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(
  first: string,
  last: string
) {
  return `${first?.[0] || ""}${
    last?.[0] || ""
  }`.toUpperCase();
}

// ============================================================
// HOMEPAGE
// ============================================================

export default async function HomePage() {
  const [
    tutors,
    selfPacedCourses,
    lessonNotes,
    heroImages,
  ] = await Promise.all([
    getFeaturedTutors(),
    getFeaturedSelfPacedCourses(),
    getFeaturedLessonNotes(),
    getHeroImages(),
  ]);

  return (
    <>
      <Navbar />

      <AdCorner />

      <main className="overflow-hidden bg-gray-950">

        {/* ==================================================
            HERO
        =================================================== */}

        <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950/60 to-purple-950/40 pt-24 pb-14 sm:pt-28 sm:pb-16 lg:pb-20">

          <HeroBackgroundSlider
            images={heroImages}
          />

          {/* Pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Glow */}
          <div className="pointer-events-none absolute top-1/4 left-1/4 w-64 h-64 sm:w-72 sm:h-72 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 right-1/4 w-64 h-64 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5 mb-6">

              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

              <span className="text-white/80 text-xs sm:text-sm font-medium">
                Now accepting new students
              </span>

            </div>

            <h1 className="font-heading font-bold text-3xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.08] mb-5 max-w-5xl mx-auto">

              Learn From The Best.{" "}

              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                On Your Schedule.
              </span>

            </h1>

            <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect with verified expert tutors, take
              structured courses, access quality study
              materials, prepare for exams and track your
              progress — all in one learning platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">

              <Link
                href="/auth/student/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-sm sm:text-base hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto"
              >
                Get Started as a Student

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/auth/tutor/register"
                className="px-7 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl text-sm sm:text-base hover:bg-white/15 transition-all w-full sm:w-auto text-center"
              >
                Apply as a Tutor
              </Link>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">

              {STATS.map(
                (stat) => (
                  <div
                    key={stat.label}
                    className="text-center"
                  >
                    <p className="font-heading font-bold text-xl sm:text-2xl text-white">
                      {stat.value}
                    </p>

                    <p className="text-white/50 text-xs sm:text-sm mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                )
              )}

            </div>

          </div>

        </section>


        {/* ==================================================
            WHY LORAN / PRODUCT DISCOVERY
        =================================================== */}

        <section className="relative py-16 sm:py-20 lg:py-24">

          <div className="pointer-events-none absolute left-1/2 top-32 h-[450px] w-[800px] max-w-full -translate-x-1/2 rounded-full bg-blue-600/[0.06] blur-[120px]" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Main heading */}

            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">

              <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-[0.18em]">
                Why Loran EduHub
              </span>

              <h2 className="font-heading font-bold text-2xl sm:text-4xl lg:text-[42px] text-white mt-3 mb-3 leading-tight">
                Everything You Need to Succeed
              </h2>

              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                A complete learning platform built for Nigerian
                students and tutors.
              </p>

            </div>


            {/* ==================================================
                MAIN PRODUCT ADVERTS
            =================================================== */}

            <div className="mb-16 lg:mb-20">

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">

                <div>

                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    Explore Loran EduHub
                  </span>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">
                    Choose the learning experience that fits you
                  </h3>

                </div>

                <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                  Study independently, download quality learning
                  resources or prepare confidently for your next
                  examination.
                </p>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">

                {/* =============================================
                    SELF-PACED
                ============================================== */}

                <Link
                  href="/self-paced"
                  className="
                    group relative flex min-h-[340px] flex-col overflow-hidden
                    rounded-[28px]
                    border border-purple-500/20
                    bg-gradient-to-br
                    from-purple-950/80
                    via-gray-900
                    to-gray-950
                    p-6 sm:p-7
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:border-purple-400/40
                    hover:shadow-2xl
                    hover:shadow-purple-950/30
                  "
                >

                  <div className="pointer-events-none absolute -right-16 -top-16 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />

                  <div className="pointer-events-none absolute right-6 top-8 w-28 h-28 border border-purple-400/10 rounded-full" />

                  <div className="pointer-events-none absolute right-12 top-14 w-16 h-16 border border-purple-300/10 rounded-full" />


                  <div className="relative flex items-start justify-between gap-3">

                    <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/20 flex items-center justify-center shrink-0">

                      <Layers className="w-6 h-6 text-purple-300" />

                    </div>

                    <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-200">
                      LEARN AT YOUR PACE
                    </span>

                  </div>


                  <div className="relative mt-8">

                    <p className="text-purple-300 text-[11px] font-bold uppercase tracking-[0.16em] mb-2">
                      Self-Paced Courses
                    </p>

                    <h3 className="font-heading text-2xl font-bold text-white leading-tight">
                      Learn Anytime.
                      <br />
                      Progress Your Way.
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-gray-400">
                      Purchase a structured course once and learn
                      on your own schedule with weekly lessons,
                      assessments, progress tracking, certificates
                      and optional coaching.
                    </p>

                  </div>


                  <div className="relative mt-auto pt-7">

                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold text-white">
                        Explore Courses
                      </span>

                      <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                        <ArrowRight className="w-4 h-4" />
                      </div>

                    </div>

                  </div>

                </Link>


                {/* =============================================
                    LESSON NOTES
                ============================================== */}

                <Link
                  href="/lesson-notes"
                  className="
                    group relative flex min-h-[340px] flex-col overflow-hidden
                    rounded-[28px]
                    border border-amber-500/20
                    bg-gradient-to-br
                    from-amber-950/60
                    via-gray-900
                    to-gray-950
                    p-6 sm:p-7
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:border-amber-400/40
                    hover:shadow-2xl
                    hover:shadow-amber-950/20
                  "
                >

                  <div className="pointer-events-none absolute -right-16 -top-16 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl group-hover:bg-amber-500/25 transition-all duration-500" />

                  <div className="pointer-events-none absolute right-8 top-11 rotate-6 w-20 h-24 rounded-xl border border-amber-300/10 bg-white/[0.02]" />

                  <div className="pointer-events-none absolute right-12 top-7 -rotate-3 w-20 h-24 rounded-xl border border-amber-300/10 bg-white/[0.02]" />


                  <div className="relative flex items-start justify-between gap-3">

                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center shrink-0">

                      <FileText className="w-6 h-6 text-amber-300" />

                    </div>

                    <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">
                      INSTANT ACCESS
                    </span>

                  </div>


                  <div className="relative mt-8">

                    <p className="text-amber-300 text-[11px] font-bold uppercase tracking-[0.16em] mb-2">
                      Lesson Notes
                    </p>

                    <h3 className="font-heading text-2xl font-bold text-white leading-tight">
                      Quality Notes.
                      <br />
                      Smarter Revision.
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-gray-400">
                      Get structured lesson notes created by
                      tutors across different subjects and class
                      levels. Explore both free and premium study
                      resources.
                    </p>

                  </div>


                  <div className="relative mt-auto pt-7">

                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold text-white">
                        Browse Lesson Notes
                      </span>

                      <div className="w-10 h-10 rounded-full bg-amber-500 text-gray-950 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">

                        <ArrowRight className="w-4 h-4" />

                      </div>

                    </div>

                  </div>

                </Link>


                {/* =============================================
                    EXAM PREP
                ============================================== */}

                <Link
                  href="/exam-prep/register"
                  className="
                    group relative flex min-h-[340px] flex-col overflow-hidden
                    rounded-[28px]
                    border border-blue-500/20
                    bg-gradient-to-br
                    from-blue-950/80
                    via-gray-900
                    to-gray-950
                    p-6 sm:p-7
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:border-blue-400/40
                    hover:shadow-2xl
                    hover:shadow-blue-950/30
                  "
                >

                  <div className="pointer-events-none absolute -right-16 -top-16 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />

                  {/* decorative graph */}

                  <div className="pointer-events-none absolute right-7 top-10 flex items-end gap-1.5 opacity-30">

                    <div className="w-2.5 h-6 bg-blue-400 rounded-full" />

                    <div className="w-2.5 h-10 bg-blue-400 rounded-full" />

                    <div className="w-2.5 h-16 bg-blue-300 rounded-full" />

                    <div className="w-2.5 h-12 bg-purple-400 rounded-full" />

                  </div>


                  <div className="relative flex items-start justify-between gap-3">

                    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center shrink-0">

                      <FileQuestion className="w-6 h-6 text-blue-300" />

                    </div>

                    <span className="rounded-full border border-green-400/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-300">
                      FREE TO START
                    </span>

                  </div>


                  <div className="relative mt-8">

                    <p className="text-blue-300 text-[11px] font-bold uppercase tracking-[0.16em] mb-2">
                      Exam Preparation
                    </p>

                    <h3 className="font-heading text-2xl font-bold text-white leading-tight">
                      Practise More.
                      <br />
                      Walk In Prepared.
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-gray-400">
                      Prepare for JAMB, WAEC and NECO with
                      practice questions, timed assessments and
                      repeated practice designed to build your
                      exam confidence.
                    </p>

                  </div>


                  <div className="relative mt-auto pt-7">

                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold text-white">
                        Start Exam Prep
                      </span>

                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">

                        <ArrowRight className="w-4 h-4" />

                      </div>

                    </div>

                  </div>

                </Link>

              </div>

            </div>


            {/* ==================================================
                PLATFORM FEATURES
            =================================================== */}

            <div className="border-t border-white/[0.07] pt-12 sm:pt-14">

              <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">

                <span className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]">
                  The Loran Advantage
                </span>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-white mt-2">
                  Built for a Better Learning Experience
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  Tools that make teaching, learning and
                  assessment easier.
                </p>

              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

                {FEATURES.map(
                  (
                    feature,
                    i
                  ) => (
                    <div
                      key={i}
                      className="
                        group
                        p-5 sm:p-6
                        rounded-2xl
                        border border-white/[0.08]
                        bg-white/[0.025]
                        hover:border-blue-500/30
                        hover:bg-white/[0.045]
                        transition-all duration-300
                      "
                    >

                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">

                        {feature.icon}

                      </div>

                      <h3 className="font-heading font-semibold text-white text-base mb-2">
                        {feature.title}
                      </h3>

                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.desc}
                      </p>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            HOW IT WORKS
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center max-w-2xl mx-auto mb-12">

              <span className="text-purple-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                Simple Process
              </span>

              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">
                Learning Made Simple
              </h2>

              <p className="text-gray-400 text-sm sm:text-base mt-3">
                Everything you need is just a few steps away.
              </p>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">

              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-indigo-400/30" />

              {HOW_IT_WORKS.map(
                (
                  step,
                  i
                ) => (
                  <div
                    key={i}
                    className="relative text-center"
                  >

                    <div className="w-16 h-16 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-center mx-auto mb-5 relative z-10 shadow-lg">

                      <span className="font-heading font-bold text-lg text-blue-400">
                        {step.step}
                      </span>

                    </div>

                    <h3 className="font-heading font-bold text-white text-lg mb-2.5">
                      {step.title}
                    </h3>

                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                      {step.desc}
                    </p>

                  </div>
                )
              )}

            </div>


            <div className="text-center mt-10">

              <Link
                href="/auth/student/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-all text-sm sm:text-base"
              >
                Create Your Student Account

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>

          </div>

        </section>


        {/* ==================================================
            PRICING / LIVE TUTORING
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-white/10 p-7 sm:p-10 lg:p-12">

              <div className="pointer-events-none absolute top-0 right-0 w-56 h-56 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl" />

              <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:items-center">

                <div>

                  <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3.5 py-1.5 mb-5">

                    <GraduationCap className="w-3.5 h-3.5 text-blue-300" />

                    <span className="text-white/80 text-xs sm:text-sm font-medium">
                      Learn directly from an expert
                    </span>

                  </div>

                  <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-4">
                    Find a Tutor That Fits Your Goals
                  </h2>

                  <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                    Each tutor sets their own pricing for monthly,
                    3-month, 6-month and 12-month plans. Compare
                    tutors, subjects, experience and pricing before
                    choosing who you want to learn with.
                  </p>

                </div>


                <div className="shrink-0">

                  <Link
                    href="/tutors"
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-950 font-bold rounded-xl hover:bg-blue-50 transition-all text-sm w-full lg:w-auto"
                  >
                    Browse Tutors

                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            FEATURED TUTORS
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">

              <div>

                <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                  Learn From Experts
                </span>

                <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">
                  Meet Our Tutors
                </h2>

                <p className="text-gray-400 text-sm mt-2 max-w-lg">
                  Explore verified tutors and find the right
                  instructor for your subject and learning goals.
                </p>

              </div>

              <Link
                href="/tutors"
                className="group inline-flex items-center gap-2 text-blue-400 font-semibold text-sm shrink-0"
              >
                View All Tutors

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>


            {tutors.length === 0 ? (

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] text-center py-12 px-5">

                <Users className="w-9 h-9 text-gray-600 mx-auto mb-3" />

                <p className="text-gray-300 font-medium">
                  New tutors are joining soon
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Check back shortly.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

                {tutors.map(
                  (
                    tutor
                  ) => (
                    <div
                      key={tutor._id}
                      className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 transition-all duration-300"
                    >

                      <div className="p-5 sm:p-6 flex items-center gap-4">

                        {tutor.profileImage ? (

                          <img
                            src={tutor.profileImage}
                            alt={`${tutor.firstName} ${tutor.lastName}`}
                            className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-white/10"
                          />

                        ) : (

                          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-300 font-heading font-bold text-lg shrink-0">

                            {getInitials(
                              tutor.firstName,
                              tutor.lastName
                            )}

                          </div>

                        )}

                        <div className="min-w-0">

                          <h3 className="font-heading font-bold text-white text-base truncate">
                            {tutor.firstName}{" "}
                            {tutor.lastName}
                          </h3>

                          <div className="flex flex-wrap gap-1.5 mt-1.5">

                            {tutor.courses
                              ?.slice(0, 2)
                              .map(
                                (
                                  course
                                ) => (
                                  <span
                                    key={course._id}
                                    className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full font-medium truncate max-w-[125px]"
                                  >
                                    {course.name}
                                  </span>
                                )
                              )}

                          </div>

                        </div>

                      </div>


                      <div className="px-5 sm:px-6 pb-5 sm:pb-6">

                        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                          {tutor.bio ||
                            "Experienced tutor on Loran EduHub."}
                        </p>

                        <Link
                          href={`/tutors/${tutor.slug}`}
                          className="group/link inline-flex items-center gap-2 text-blue-400 font-semibold text-sm"
                        >
                          View Profile

                          <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                        </Link>

                      </div>

                    </div>
                  )
                )}

              </div>

            )}

          </div>

        </section>


        {/* ==================================================
            SELF-PACED COURSES
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">

              <div>

                <span className="text-purple-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                  Learn On Your Own Time
                </span>

                <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">
                  Featured Self-Paced Courses
                </h2>

                <p className="text-gray-400 text-sm mt-2 max-w-xl">
                  Purchase once and learn at your own pace with
                  structured weekly content, assessments and
                  completion certificates.
                </p>

              </div>

              <Link
                href="/self-paced"
                className="group inline-flex items-center gap-2 text-purple-400 font-semibold text-sm shrink-0"
              >
                Browse All Courses

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>


            {selfPacedCourses.length === 0 ? (

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] text-center py-12 px-5">

                <Layers className="w-9 h-9 text-gray-600 mx-auto mb-3" />

                <p className="text-gray-300 font-medium">
                  New self-paced courses are coming soon
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Check back shortly.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

                {selfPacedCourses.map(
                  (
                    course
                  ) => (
                    <Link
                      key={course._id}
                      href={`/self-paced/${course._id}`}
                      className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/10 transition-all duration-300"
                    >

                      <div className="relative h-44 sm:h-48 bg-white/5 overflow-hidden">

                        {course.coverImageUrl ? (

                          <img
                            src={course.coverImageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                        ) : (

                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-950/60 to-gray-900">

                            <Layers className="w-9 h-9 text-purple-400/50" />

                          </div>

                        )}


                        <div className="absolute top-3 right-3">

                          <span
                            className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
                              course.isFree
                                ? "bg-green-500/90 text-white"
                                : "bg-gray-950/80 text-white"
                            }`}
                          >
                            {course.isFree
                              ? "Free"
                              : `₦${course.price.toLocaleString(
                                  "en-NG"
                                )}`}
                          </span>

                        </div>

                      </div>


                      <div className="p-5">

                        <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-semibold uppercase tracking-wider mb-2">

                          <BookOpen className="w-3 h-3" />

                          Self-Paced

                        </div>

                        <h3 className="font-heading font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-purple-200 transition-colors">
                          {course.title}
                        </h3>

                        <p className="text-gray-500 text-xs mb-4">
                          {course.tutorName}
                          {" · "}
                          {course.weekCount}{" "}
                          week
                          {course.weekCount !== 1
                            ? "s"
                            : ""}
                        </p>

                        <div className="flex items-center justify-between">

                          <span className="text-xs font-semibold text-gray-400">
                            View Course
                          </span>

                          <ChevronRight className="w-4 h-4 text-purple-400 transition-transform group-hover:translate-x-1" />

                        </div>

                      </div>

                    </Link>
                  )
                )}

              </div>

            )}


            <div className="text-center mt-9">

              <Link
                href="/self-paced"
                className="group inline-flex items-center gap-2 px-6 py-3 border border-white/15 bg-white/[0.05] text-white font-semibold rounded-xl hover:bg-white/[0.09] transition-all text-sm"
              >
                Explore Self-Paced Learning

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>

          </div>

        </section>


        {/* ==================================================
            LESSON NOTES
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">

              <div>

                <span className="text-amber-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                  Study Smarter
                </span>

                <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">
                  Featured Lesson Notes
                </h2>

                <p className="text-gray-400 text-sm mt-2 max-w-xl">
                  Access quality learning materials created by
                  tutors across subjects and class levels.
                </p>

              </div>

              <Link
                href="/lesson-notes"
                className="group inline-flex items-center gap-2 text-amber-400 font-semibold text-sm shrink-0"
              >
                Browse All Notes

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>


            {lessonNotes.length === 0 ? (

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] text-center py-12 px-5">

                <FileText className="w-9 h-9 text-gray-600 mx-auto mb-3" />

                <p className="text-gray-300 font-medium">
                  New lesson notes are being added
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Check back shortly.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

                {lessonNotes.map(
                  (
                    note
                  ) => (
                    <Link
                      key={note._id}
                      href={`/lesson-notes/${note._id}`}
                      className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-950/10 transition-all duration-300"
                    >

                      {/* COVER */}

                      <div className="relative h-44 sm:h-48 bg-white/5 overflow-hidden">

                        {note.coverImageUrl ? (

                          <img
                            src={note.coverImageUrl}
                            alt={note.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                        ) : (

                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/40 to-gray-900">

                            <FileText className="w-9 h-9 text-amber-500/40" />

                          </div>

                        )}


                        <div className="absolute top-3 right-3">

                          <span
                            className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
                              note.isFree
                                ? "bg-green-500/90 text-white"
                                : "bg-gray-950/80 text-white"
                            }`}
                          >
                            {note.isFree
                              ? "Free"
                              : `₦${note.price.toLocaleString(
                                  "en-NG"
                                )}`}
                          </span>

                        </div>

                      </div>


                      {/* CONTENT */}

                      <div className="p-5">

                        <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-semibold uppercase tracking-wider mb-2">

                          <FileText className="w-3 h-3" />

                          Lesson Note

                        </div>

                        <h3 className="font-heading font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-amber-200 transition-colors">
                          {note.title}
                        </h3>

                        <p className="text-gray-500 text-xs mb-1">
                          By {note.tutorName}
                        </p>

                        <p className="text-gray-500 text-xs mb-4">
                          {note.subject ||
                            "General"}

                          {" · "}

                          {note.studentClass
                            ? note.studentClass.toUpperCase()
                            : "All levels"}

                          {note.weekCount > 0 && (
                            <>
                              {" · "}
                              {note.weekCount}{" "}
                              week
                              {note.weekCount !== 1
                                ? "s"
                                : ""}
                            </>
                          )}
                        </p>

                        <div className="flex items-center justify-between">

                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">

                            <Download className="w-3.5 h-3.5" />

                            View Resource

                          </span>

                          <ChevronRight className="w-4 h-4 text-amber-400 transition-transform group-hover:translate-x-1" />

                        </div>

                      </div>

                    </Link>
                  )
                )}

              </div>

            )}


            <div className="text-center mt-9">

              <Link
                href="/lesson-notes"
                className="group inline-flex items-center gap-2 px-6 py-3 border border-white/15 bg-white/[0.05] text-white font-semibold rounded-xl hover:bg-white/[0.09] transition-all text-sm"
              >
                Browse Lesson Notes

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>

          </div>

        </section>


        {/* ==================================================
            EXAM PREP FEATURE
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="relative overflow-hidden rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-blue-950 via-indigo-950/90 to-purple-950 p-6 sm:p-10 lg:p-12">

              {/* Background decoration */}

              <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 left-1/4 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" />


              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:items-center">

                {/* LEFT */}

                <div>

                  <div className="inline-flex items-center gap-2 border border-green-400/20 bg-green-500/10 rounded-full px-3 py-1.5 mb-5">

                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

                    <span className="text-green-200 text-xs font-semibold">
                      Free practice available
                    </span>

                  </div>

                  <span className="block text-blue-300 text-xs font-bold uppercase tracking-[0.17em] mb-3">
                    Exam Preparation
                  </span>

                  <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                    Prepare Smarter.
                    <br />
                    Perform Better.
                  </h2>

                  <p className="text-indigo-100/70 text-sm sm:text-base leading-relaxed mt-5 max-w-xl">
                    Practise JAMB, WAEC and NECO questions,
                    challenge yourself with exam-style tests and
                    improve your confidence before exam day.
                  </p>


                  <div className="flex flex-col sm:flex-row gap-3 mt-7">

                    <Link
                      href="/exam-prep/register"
                      className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-indigo-800 font-bold rounded-xl hover:bg-blue-50 transition-all text-sm"
                    >
                      Start Exam Prep

                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <Link
                      href="/exam-prep/take"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/15 transition-all text-sm"
                    >
                      <PlayCircle className="w-4 h-4" />

                      Take Practice Exam
                    </Link>

                  </div>

                </div>


                {/* RIGHT */}

                <div className="grid grid-cols-2 gap-3 sm:gap-4">

                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur p-4 sm:p-5">

                    <BrainCircuit className="w-6 h-6 text-blue-300 mb-5" />

                    <p className="font-heading text-xl sm:text-2xl font-bold text-white">
                      JAMB
                    </p>

                    <p className="text-indigo-200/60 text-xs mt-1">
                      Practice questions
                    </p>

                  </div>


                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur p-4 sm:p-5 mt-5">

                    <FileQuestion className="w-6 h-6 text-purple-300 mb-5" />

                    <p className="font-heading text-xl sm:text-2xl font-bold text-white">
                      WAEC
                    </p>

                    <p className="text-indigo-200/60 text-xs mt-1">
                      Exam preparation
                    </p>

                  </div>


                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur p-4 sm:p-5">

                    <Trophy className="w-6 h-6 text-amber-300 mb-5" />

                    <p className="font-heading text-xl sm:text-2xl font-bold text-white">
                      NECO
                    </p>

                    <p className="text-indigo-200/60 text-xs mt-1">
                      Test your knowledge
                    </p>

                  </div>


                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur p-4 sm:p-5 mt-5">

                    <TrendingUp className="w-6 h-6 text-green-300 mb-5" />

                    <p className="font-heading text-xl sm:text-2xl font-bold text-white">
                      Progress
                    </p>

                    <p className="text-indigo-200/60 text-xs mt-1">
                      Improve with practice
                    </p>

                  </div>

                </div>

              </div>


              <p className="relative text-indigo-200/50 text-xs mt-8">
                Start practising without a credit card.
              </p>

            </div>

          </div>

        </section>


        {/* ==================================================
            DISCORD + TUTOR TOOLING
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* STUDENT / DISCORD */}

              <div className="rounded-[28px] border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-gray-950 p-6 sm:p-8">

                <div className="w-12 h-12 bg-indigo-500/15 rounded-2xl flex items-center justify-center mb-6">

                  <svg
                    className="w-6 h-6 text-indigo-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>

                </div>

                <span className="text-indigo-300 text-xs uppercase tracking-wider font-bold">
                  Community Learning
                </span>

                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mt-3 mb-4">
                  Learning Doesn't Have to Be Lonely
                </h2>

                <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                  Students enrolled with tutors can connect
                  through structured Discord communities for live
                  sessions, class discussions, schedules and
                  announcements.
                </p>


                <div className="space-y-3">

                  {[
                    "Private learning communities",
                    "Class schedules and announcements",
                    "Study alongside other learners",
                    "Direct access to tutor-led discussions",
                  ].map(
                    (
                      item
                    ) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-gray-300 text-sm"
                      >

                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />

                        <span>{item}</span>

                      </div>
                    )
                  )}

                </div>

              </div>


              {/* TUTOR TOOLING */}

              <div className="rounded-[28px] bg-gradient-to-br from-purple-600/15 to-indigo-600/10 border border-white/10 p-6 sm:p-8">

                <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-5">

                  <Briefcase className="w-6 h-6 text-purple-300" />

                </div>

                <span className="text-purple-300 text-xs uppercase tracking-wider font-bold">
                  For Educators
                </span>

                <h3 className="font-heading font-bold text-white text-xl sm:text-2xl mt-3 mb-3">
                  More Than a Place to Sell Courses
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Tutors get a complete workspace for managing
                  students, teaching resources, assessments,
                  certificates and their earnings.
                </p>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {[
                    {
                      icon: (
                        <FileQuestion className="w-4 h-4" />
                      ),
                      title:
                        "Exams & Assignments",
                      desc:
                        "Create assessments and manage student submissions.",
                    },

                    {
                      icon: (
                        <ScrollText className="w-4 h-4" />
                      ),
                      title:
                        "Certificates",
                      desc:
                        "Issue certificates based on real learner performance.",
                    },

                    {
                      icon: (
                        <Megaphone className="w-4 h-4" />
                      ),
                      title:
                        "Announcements",
                      desc:
                        "Keep students informed about classes and updates.",
                    },

                    {
                      icon: (
                        <ClipboardList className="w-4 h-4" />
                      ),
                      title:
                        "Course Library",
                      desc:
                        "Build structured teaching materials for your learners.",
                    },
                  ].map(
                    (
                      feature
                    ) => (
                      <div
                        key={feature.title}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
                      >

                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-purple-300 mb-3">

                          {feature.icon}

                        </div>

                        <p className="text-white text-sm font-semibold">
                          {feature.title}
                        </p>

                        <p className="text-gray-500 text-xs leading-relaxed mt-1">
                          {feature.desc}
                        </p>

                      </div>
                    )
                  )}

                </div>


                <Link
                  href="/auth/tutor/register"
                  className="group inline-flex items-center gap-2 mt-7 text-purple-300 font-semibold text-sm"
                >
                  Apply as a Tutor

                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            SCHOLARSHIPS / OPPORTUNITIES
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 sm:p-10">

              <div className="pointer-events-none absolute right-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />

              <div className="relative flex flex-col lg:flex-row items-center gap-7 sm:gap-8">

                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center shrink-0">

                  <Briefcase className="w-8 h-8 sm:w-9 sm:h-9 text-blue-400" />

                </div>

                <div className="text-center lg:text-left">

                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                    Opportunities
                  </span>

                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-white mt-2 mb-2">
                    Beyond the Classroom
                  </h3>

                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Loran EduHub also helps students and tutors
                    discover scholarship listings, internships
                    and career opportunities alongside their
                    learning journey.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            TESTIMONIALS
        =================================================== */}

        <section className="py-16 sm:py-20 lg:py-24 bg-white/[0.02] border-y border-white/5">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center max-w-2xl mx-auto mb-12">

              <span className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                Testimonials
              </span>

              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-white mt-3">
                What Our Students Say
              </h2>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">

              {[
                {
                  name:
                    "Tunde Adeyemi",
                  course:
                    "Mathematics",
                  quote:
                    "I went from failing maths to scoring A1 in WAEC. My tutor's teaching style on Discord made everything click.",
                  initials:
                    "TA",
                },

                {
                  name:
                    "Blessing Okoro",
                  course:
                    "English Language",
                  quote:
                    "The free trial convinced me. After a few months, my essay writing improved tremendously.",
                  initials:
                    "BO",
                },

                {
                  name:
                    "Emeka Nwosu",
                  course:
                    "Computer Science",
                  quote:
                    "Being able to see my exam grades and assignment scores in the dashboard keeps me motivated to study harder.",
                  initials:
                    "EN",
                },
              ].map(
                (
                  testimonial
                ) => (
                  <article
                    key={
                      testimonial.name
                    }
                    className="bg-white/[0.03] rounded-2xl p-6 border border-white/10"
                  >

                    <div className="flex items-center gap-1 mb-4">

                      {[...Array(
                        5
                      )].map(
                        (
                          _,
                          j
                        ) => (
                          <svg
                            key={j}
                            className="w-4 h-4 text-amber-400 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )
                      )}

                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm">
                        {testimonial.initials}
                      </div>

                      <div>

                        <p className="font-semibold text-white text-sm">
                          {testimonial.name}
                        </p>

                        <p className="text-gray-500 text-xs">
                          {testimonial.course} Student
                        </p>

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>

          </div>

        </section>


        {/* ==================================================
            FINAL CTA
        =================================================== */}

        <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden">

          <div className="pointer-events-none absolute left-1/2 bottom-0 w-[700px] h-[350px] max-w-full -translate-x-1/2 bg-blue-600/10 rounded-full blur-[120px]" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">

            <div className="w-14 h-14 mx-auto rounded-2xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-center mb-6">

              <Sparkles className="w-6 h-6 text-blue-300" />

            </div>

            <span className="text-blue-400 text-xs font-bold uppercase tracking-[0.18em]">
              Your Learning Journey Starts Here
            </span>

            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mt-3 leading-tight">
              Ready to Take the Next Step?
            </h2>

            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mt-4 leading-relaxed">
              Learn with a tutor, take a self-paced course,
              access lesson notes or start preparing for your
              exams today.
            </p>


            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">

              <Link
                href="/auth/student/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all w-full sm:w-auto"
              >
                Get Started

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/tutors"
                className="inline-flex items-center justify-center px-7 py-3.5 border border-white/15 bg-white/[0.05] text-white font-semibold rounded-xl hover:bg-white/[0.09] transition-all w-full sm:w-auto"
              >
                Browse Tutors
              </Link>

            </div>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}