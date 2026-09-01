// app/(public)/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdCorner from "@/components/home/AdCorner";
import HeroBackgroundSlider from "@/components/home/HeroBackgroundSlider";

import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Code2,
  Download,
  FileQuestion,
  FileText,
  Globe2,
  GraduationCap,
  Languages,
  Layers,
  MessageSquare,
  MonitorPlay,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Video,
  Zap,
} from "lucide-react";

// ============================================================
// SEO
// ============================================================

const SITE_URL = "https://www.loran-eduhub.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    absolute:
      "Loran EduHub | Live Online Tutors, Self-Paced Courses & Exam Prep",
  },

  description:
    "Learn with verified online tutors, master new languages and tech skills, prepare for JAMB, WAEC, NECO and international exams, take self-paced courses, access lesson notes and earn certificates with Loran EduHub.",

  keywords: [
    "Loran EduHub",
    "online tutors Nigeria",
    "live online tutoring Nigeria",
    "online courses Nigeria",
    "self paced courses Nigeria",
    "learn tech skills online",
    "learn languages online",
    "career skills Nigeria",
    "job ready skills",
    "JAMB preparation",
    "WAEC preparation",
    "NECO preparation",
    "IGCSE tutor",
    "IELTS tutor",
    "international exam preparation",
    "online lesson notes Nigeria",
    "online learning platform Nigeria",
    "certificate courses Nigeria",
  ],

  authors: [
    {
      name: "Loran EduHub",
    },
  ],

  creator: "Loran EduHub",
  publisher: "Loran EduHub",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Loran EduHub",

    title:
      "Loran EduHub | Learn Skills, Prepare for Exams & Grow Your Career",

    description:
      "Learn live with expert tutors, build valuable skills through self-paced courses, prepare for local and international exams, and earn certificates that support your career growth.",

    locale: "en_NG",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Loran EduHub | Live Tutors, Courses & Exam Preparation",

    description:
      "Learn new languages, master tech skills, become job-ready, prepare for exams and earn certificates with Loran EduHub.",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "education",
};

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
// FETCH LESSON NOTES
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
  firstName: string,
  lastName: string
) {
  return `${firstName?.[0] || ""}${
    lastName?.[0] || ""
  }`.toUpperCase();
}

function formatMoney(amount: number) {
  return `₦${Number(amount || 0).toLocaleString(
    "en-NG"
  )}`;
}

// ============================================================
// LEARNING GOALS
// ============================================================

const LEARNING_GOALS = [
  {
    icon: Languages,

    eyebrow: "Languages",

    title: "Learn a New Language",

    description:
      "Build real communication skills with a tutor who can guide your speaking, listening, reading and writing.",

    examples: [
      "French",
      "German",
      "Chinese",
      "Igbo",
      "English & Phonetics",
    ],

    accent:
      "from-blue-500/15 to-cyan-500/5",

    iconStyle:
      "bg-blue-500/10 text-blue-400",
  },

  {
    icon: Code2,

    eyebrow: "Technology",

    title: "Learn a Valuable Tech Skill",

    description:
      "Develop practical digital skills for today's workplace with guidance from experienced instructors.",

    examples: [
      "Web Development",
      "Python & Django",
      "AI & Machine Learning",
      "Data Analysis",
      "Video & Graphic Design",
    ],

    accent:
      "from-violet-500/15 to-purple-500/5",

    iconStyle:
      "bg-violet-500/10 text-violet-400",
  },

  {
    icon: BriefcaseBusiness,

    eyebrow: "Career",

    title: "Become Job-Ready",

    description:
      "Gain practical, career-focused knowledge that can strengthen your portfolio, confidence and employability.",

    examples: [
      "Project Management",
      "Content Creation",
      "Social Media Marketing",
      "Digital Skills",
      "Professional Development",
    ],

    accent:
      "from-emerald-500/15 to-teal-500/5",

    iconStyle:
      "bg-emerald-500/10 text-emerald-400",
  },

  {
    icon: Trophy,

    eyebrow: "Exam Success",

    title: "Prepare for Important Exams",

    description:
      "Work with tutors who can help you understand difficult topics, practise effectively and prepare with confidence.",

    examples: [
      "JAMB",
      "WAEC",
      "NECO",
      "IGCSE",
      "IELTS & Other International Exams",
    ],

    accent:
      "from-amber-500/15 to-orange-500/5",

    iconStyle:
      "bg-amber-500/10 text-amber-400",
  },
];

// ============================================================
// PLATFORM FEATURES
// ============================================================

const PLATFORM_FEATURES = [
  {
    icon: ShieldCheck,

    title: "Verified Tutors",

    description:
      "Tutor applications are reviewed before instructors are approved to teach on the platform.",
  },

  {
    icon: MonitorPlay,

    title: "Flexible Learning",

    description:
      "Choose live tutor-led learning or study independently through structured self-paced courses.",
  },

  {
    icon: Target,

    title: "Progress Tracking",

    description:
      "Follow your courses, assessments, scores and learning progress from your student dashboard.",
  },

  {
    icon: FileQuestion,

    title: "Assessments",

    description:
      "Test what you have learned through online examinations, assignments and course assessments.",
  },

  {
    icon: MessageSquare,

    title: "Learning Community",

    description:
      "Stay connected through tutor communities, announcements and structured learning interactions.",
  },

  {
    icon: Award,

    title: "Achievement Certificates",

    description:
      "Eligible live tutoring and self-paced programmes can culminate in certificates that showcase completed learning.",
  },
];

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

  // ==========================================================
  // STRUCTURED DATA / SEO
  // ==========================================================

  const organizationSchema = {
    "@context": "https://schema.org",

    "@type": "EducationalOrganization",

    name: "Loran EduHub",

    url: SITE_URL,

    description:
      "Loran EduHub is an online learning platform connecting learners with live tutors, self-paced courses, lesson notes and exam preparation resources.",

    areaServed: {
      "@type": "Country",
      name: "Nigeria",
    },

    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",

    "@type": "WebSite",

    name: "Loran EduHub",

    url: SITE_URL,

    description:
      "Learn languages, technology skills, career skills and prepare for local and international examinations with live tutors and self-paced learning.",
  };

  return (
    <>
      {/* ======================================================
          STRUCTURED DATA
      ======================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            organizationSchema
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            websiteSchema
          ),
        }}
      />

      <Navbar />

      <AdCorner />

      <main className="overflow-hidden bg-slate-950">

        {/* ====================================================
            HERO
        ===================================================== */}

        <section className="relative min-h-[680px] overflow-hidden pt-24 sm:pt-28 lg:min-h-[720px]">

          <HeroBackgroundSlider
            images={heroImages}
          />

          {/* Strong readability overlays */}

          <div className="absolute inset-0 bg-slate-950/75" />

          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950" />

          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-transparent to-violet-950/30" />

          {/* Decorative glows */}

          <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-500/15 blur-[100px]" />

          <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-violet-600/15 blur-[120px]" />


          <div className="relative z-10 mx-auto flex min-h-[590px] max-w-7xl items-center px-4 pb-16 sm:px-6 lg:px-8">

            <div className="mx-auto max-w-5xl text-center">

              {/* Badge */}

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 backdrop-blur-md">

                <Sparkles className="h-3.5 w-3.5 text-amber-300" />

                <span className="text-xs font-semibold text-white/80 sm:text-sm">
                  Learn today. Build skills for tomorrow.
                </span>

              </div>


              <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">

                Learn the Skills That Can{" "}

                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  Change Your Future.
                </span>

              </h1>


              <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">

                Learn a new language, master a tech skill,
                become job-ready or prepare for local and
                international exams — with expert live tutors
                and flexible online learning on Loran EduHub.

              </p>


              {/* Search-style topic pills */}

              <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">

                {[
                  "Languages",
                  "Technology",
                  "Career Skills",
                  "JAMB",
                  "WAEC",
                  "IGCSE",
                  "IELTS",
                ].map(
                  (
                    item
                  ) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-sm sm:text-xs"
                    >
                      {item}
                    </span>
                  )
                )}

              </div>


              {/* CTAs */}

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

                <Link
                  href="/courses"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500 sm:w-auto sm:text-base"
                >
                  Find a Live Course

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>


                <Link
                  href="/self-paced"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.13] sm:w-auto sm:text-base"
                >
                  Explore Self-Paced Courses
                </Link>

              </div>


              {/* Trust row */}

              <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">

                {[
                  {
                    icon: BadgeCheck,
                    label:
                      "Verified Tutors",
                  },

                  {
                    icon: Video,
                    label:
                      "Live Learning",
                  },

                  {
                    icon: GraduationCap,
                    label:
                      "Certificates",
                  },

                  {
                    icon: Target,
                    label:
                      "Career Focused",
                  },
                ].map(
                  (
                    item
                  ) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 backdrop-blur-sm"
                    >
                      <item.icon className="h-3.5 w-3.5 text-blue-300" />

                      <span className="text-[10px] font-semibold text-slate-300 sm:text-xs">
                        {item.label}
                      </span>
                    </div>
                  )
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            WHY LORAN + 4 PRIMARY ADVERTS
        ===================================================== */}

        <section className="relative py-16 sm:py-20 lg:py-24">

          <div className="pointer-events-none absolute left-1/2 top-20 h-[600px] w-[900px] max-w-full -translate-x-1/2 rounded-full bg-blue-500/[0.05] blur-[120px]" />


          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                Why Loran EduHub
              </span>

              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Everything You Need to Succeed
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Choose the learning experience that fits your
                goals — from personal live instruction to
                independent courses, study materials and exam
                practice.
              </p>

            </div>


            {/* =================================================
                FOUR PRODUCT ADVERTS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">

              {/* ===============================================
                  LIVE TUTORING
              ================================================ */}

              <Link
                href="/courses"
                className="group relative min-h-[410px] overflow-hidden rounded-[30px] border border-blue-400/20 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-950/30 sm:p-8"
              >

                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl transition group-hover:bg-blue-500/30" />

                <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />


                <div className="relative flex h-full flex-col">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15">
                      <Video className="h-6 w-6 text-blue-300" />
                    </div>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                      Personal Learning
                    </span>

                  </div>


                  <div className="mt-9">

                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                      Live Tutoring
                    </p>

                    <h3 className="mt-2 max-w-lg font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Learn Live With a Tutor Who Helps You Move Forward.
                    </h3>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                      Learn a language, master a tech skill,
                      become job-ready or prepare for local and
                      international examinations with direct
                      support from an experienced tutor.
                    </p>


                    <div className="mt-5 flex flex-wrap gap-2">

                      {[
                        "Languages",
                        "Tech Skills",
                        "Career Skills",
                        "Exam Prep",
                      ].map(
                        (
                          item
                        ) => (
                          <span
                            key={item}
                            className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-slate-300"
                          >
                            {item}
                          </span>
                        )
                      )}

                    </div>

                  </div>


                  <div className="mt-auto pt-8">

                    <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-400/10 bg-blue-400/[0.06] p-3">

                      <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                      <p className="text-[11px] leading-5 text-slate-300 sm:text-xs">
                        Complete an eligible learning programme
                        and earn a certificate that can help
                        demonstrate your newly developed skills
                        as you grow your career.
                      </p>

                    </div>


                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold text-white">
                        Browse Live Courses
                      </span>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </div>

                    </div>

                  </div>

                </div>

              </Link>


              {/* ===============================================
                  SELF-PACED
              ================================================ */}

              <Link
                href="/self-paced"
                className="group relative min-h-[410px] overflow-hidden rounded-[30px] border border-violet-400/20 bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-2xl hover:shadow-violet-950/30 sm:p-8"
              >

                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl transition group-hover:bg-violet-500/30" />


                <div className="relative flex h-full flex-col">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/15">
                      <Layers className="h-6 w-6 text-violet-300" />
                    </div>

                    <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-200">
                      Learn Your Way
                    </span>

                  </div>


                  <div className="mt-9">

                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
                      Self-Paced Courses
                    </p>

                    <h3 className="mt-2 max-w-lg font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Build a Skill on Your Schedule.
                    </h3>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                      Learn independently through structured
                      weekly content, assessments and progress
                      tracking. Move through each course at a
                      pace that works for your life.
                    </p>


                    <div className="mt-5 flex flex-wrap gap-2">

                      {[
                        "Structured Lessons",
                        "Assessments",
                        "Progress Tracking",
                        "Optional Coaching",
                      ].map(
                        (
                          item
                        ) => (
                          <span
                            key={item}
                            className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-slate-300"
                          >
                            {item}
                          </span>
                        )
                      )}

                    </div>

                  </div>


                  <div className="mt-auto pt-8">

                    <div className="mb-5 flex items-start gap-2 rounded-xl border border-violet-400/10 bg-violet-400/[0.06] p-3">

                      <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />

                      <p className="text-[11px] leading-5 text-slate-300 sm:text-xs">
                        Complete the required learning and
                        assessments to earn a certificate that
                        records your achievement and supports
                        your professional growth.
                      </p>

                    </div>


                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold text-white">
                        Explore Self-Paced Courses
                      </span>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </div>

                    </div>

                  </div>

                </div>

              </Link>


              {/* ===============================================
                  EXAM PREP
              ================================================ */}

              <Link
                href="/exam-prep/register"
                className="group relative min-h-[365px] overflow-hidden rounded-[30px] border border-cyan-400/20 bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-950/20 sm:p-8"
              >

                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl transition group-hover:bg-cyan-500/25" />


                <div className="relative flex h-full flex-col">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/15">
                      <FileQuestion className="h-6 w-6 text-cyan-300" />
                    </div>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                      Practise & Improve
                    </span>

                  </div>


                  <div className="mt-8">

                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Exam Preparation
                    </p>

                    <h3 className="mt-2 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Practise Today. Walk Into Your Exam More Prepared.
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      Prepare with exam-style practice,
                      strengthen weak areas and build confidence
                      before important examinations.
                    </p>

                  </div>


                  <div className="mt-auto pt-7">

                    <div className="mb-5 flex flex-wrap gap-2">

                      {[
                        "JAMB",
                        "WAEC",
                        "NECO",
                        "Timed Practice",
                      ].map(
                        (
                          exam
                        ) => (
                          <span
                            key={exam}
                            className="rounded-lg border border-cyan-400/10 bg-cyan-500/[0.06] px-2.5 py-1 text-[10px] font-semibold text-cyan-200"
                          >
                            {exam}
                          </span>
                        )
                      )}

                    </div>


                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold text-white">
                        Start Exam Prep
                      </span>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </div>

                    </div>

                  </div>

                </div>

              </Link>


              {/* ===============================================
                  LESSON NOTES
              ================================================ */}

              <Link
                href="/lesson-notes"
                className="group relative min-h-[365px] overflow-hidden rounded-[30px] border border-amber-400/20 bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-amber-950/20 sm:p-8"
              >

                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl transition group-hover:bg-amber-500/25" />


                <div className="relative flex h-full flex-col">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/15">
                      <FileText className="h-6 w-6 text-amber-300" />
                    </div>

                    <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                      Ready to Study
                    </span>

                  </div>


                  <div className="mt-8">

                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                      Lesson Notes
                    </p>

                    <h3 className="mt-2 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Clear Notes for Better Study and Revision.
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      Access tutor-created learning materials
                      across subjects and class levels whenever
                      you need an extra resource for study,
                      teaching or revision.
                    </p>

                  </div>


                  <div className="mt-auto pt-7">

                    <div className="mb-5 flex flex-wrap gap-2">

                      {[
                        "Tutor Created",
                        "Multiple Subjects",
                        "Free & Premium",
                        "Instant Access",
                      ].map(
                        (
                          item
                        ) => (
                          <span
                            key={item}
                            className="rounded-lg border border-amber-400/10 bg-amber-500/[0.06] px-2.5 py-1 text-[10px] font-semibold text-amber-200"
                          >
                            {item}
                          </span>
                        )
                      )}

                    </div>


                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold text-white">
                        Browse Lesson Notes
                      </span>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-slate-950 transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </div>

                    </div>

                  </div>

                </div>

              </Link>

            </div>

          </div>

        </section>


        {/* ====================================================
            WHAT CAN YOU LEARN?
        ===================================================== */}

        <section className="border-y border-white/[0.06] bg-white/[0.02] py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">

              {/* Heading */}

              <div className="lg:sticky lg:top-28">

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                  What's There to Learn?
                </span>

                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Learn Something That Moves Your Life Forward.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                  Learning should lead somewhere. Whether your
                  goal is communicating in a new language,
                  entering the technology industry, becoming
                  more competitive for jobs or passing an
                  important examination, Loran EduHub helps you
                  find a path forward.
                </p>


                <Link
                  href="/courses"
                  className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50"
                >
                  Explore Live Courses

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

              </div>


              {/* Learning goal cards */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {LEARNING_GOALS.map(
                  (
                    goal
                  ) => {
                    const Icon =
                      goal.icon;

                    return (
                      <div
                        key={
                          goal.title
                        }
                        className={`group rounded-3xl border border-white/[0.08] bg-gradient-to-br ${goal.accent} p-5 transition hover:-translate-y-1 hover:border-white/[0.14] sm:p-6`}
                      >

                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${goal.iconStyle}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>


                        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {
                            goal.eyebrow
                          }
                        </p>

                        <h3 className="mt-1 font-heading text-lg font-bold text-white sm:text-xl">
                          {
                            goal.title
                          }
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                          {
                            goal.description
                          }
                        </p>


                        <div className="mt-5 flex flex-wrap gap-1.5">

                          {goal.examples.map(
                            (
                              example
                            ) => (
                              <span
                                key={
                                  example
                                }
                                className="rounded-full border border-white/[0.08] bg-slate-950/30 px-2.5 py-1 text-[10px] font-medium text-slate-300"
                              >
                                {
                                  example
                                }
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            CAREER + CERTIFICATE
        ===================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="relative overflow-hidden rounded-[32px] border border-violet-400/20 bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-950 p-6 sm:p-9 lg:p-12">

              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[90px]" />

              <div className="pointer-events-none absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]" />


              <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">

                {/* LEFT */}

                <div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5">

                    <Award className="h-3.5 w-3.5 text-amber-300" />

                    <span className="text-xs font-bold text-amber-100">
                      Learn. Complete. Show What You Achieved.
                    </span>

                  </div>


                  <h2 className="mt-5 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                    Build Skills That Keep You{" "}
                    <span className="text-blue-300">
                      Career-Ready.
                    </span>
                  </h2>


                  <p className="mt-5 max-w-xl text-sm leading-7 text-indigo-100/70 sm:text-base">

                    The goal is not simply to finish a course.
                    It is to leave with stronger knowledge,
                    practical skills and evidence of what you
                    have completed.

                  </p>


                  <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100/70 sm:text-base">

                    Eligible live tutoring programmes and
                    self-paced courses can offer completion
                    certificates, giving learners another way
                    to document skills as they build a
                    portfolio, apply for opportunities and
                    scale their careers.

                  </p>


                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                    <Link
                      href="/courses"
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-blue-50"
                    >
                      Learn With a Live Tutor

                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>


                    <Link
                      href="/self-paced"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
                    >
                      Browse Self-Paced Courses
                    </Link>

                  </div>

                </div>


                {/* RIGHT */}

                <div className="grid grid-cols-2 gap-3 sm:gap-4">

                  <CareerCard
                    icon={
                      Code2
                    }
                    title="Build"
                    description="Develop a practical skill."
                  />

                  <CareerCard
                    icon={
                      Target
                    }
                    title="Practise"
                    description="Apply what you are learning."
                    raised
                  />

                  <CareerCard
                    icon={
                      Award
                    }
                    title="Complete"
                    description="Earn an eligible certificate."
                  />

                  <CareerCard
                    icon={
                      Rocket
                    }
                    title="Grow"
                    description="Use your skills to pursue your next opportunity."
                    raised
                  />

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            FEATURED LIVE TUTORS
        ===================================================== */}

        <section className="border-y border-white/[0.06] bg-white/[0.02] py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <SectionHeading
              eyebrow="Live Learning"
              title="Meet Tutors Ready to Help You Grow"
              description="Explore verified tutors, the subjects and skills they teach, and find someone who fits your learning goals."
              href="/tutors"
              linkText="View All Tutors"
            />


            {tutors.length ===
            0 ? (
              <EmptyState
                icon={
                  Users
                }
                title="New tutors are joining"
                description="Our tutor community is growing. Check back shortly to discover more instructors."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {tutors.map(
                  (
                    tutor
                  ) => (
                    <article
                      key={
                        tutor._id
                      }
                      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.045]"
                    >

                      <div className="p-5 sm:p-6">

                        <div className="flex items-center gap-4">

                          {tutor.profileImage ? (
                            <img
                              src={
                                tutor.profileImage
                              }
                              alt={`${tutor.firstName} ${tutor.lastName}, tutor on Loran EduHub`}
                              className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-500/15 font-heading text-lg font-bold text-blue-300">
                              {getInitials(
                                tutor.firstName,
                                tutor.lastName
                              )}
                            </div>
                          )}


                          <div className="min-w-0">

                            <div className="flex items-center gap-1.5">
                              <h3 className="truncate font-heading text-base font-bold text-white">
                                {
                                  tutor.firstName
                                }{" "}
                                {
                                  tutor.lastName
                                }
                              </h3>

                              <BadgeCheck className="h-4 w-4 shrink-0 text-blue-400" />
                            </div>


                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-400">
                              Verified Tutor
                            </p>

                          </div>

                        </div>


                        {tutor.courses?.length >
                          0 && (
                          <div className="mt-5 flex flex-wrap gap-1.5">

                            {tutor.courses
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  course
                                ) => (
                                  <span
                                    key={
                                      course._id
                                    }
                                    className="max-w-full truncate rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium text-blue-300"
                                  >
                                    {
                                      course.name
                                    }
                                  </span>
                                )
                              )}

                          </div>
                        )}


                        <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-6 text-slate-400">
                          {tutor.bio ||
                            "Learn with an experienced tutor on Loran EduHub."}
                        </p>


                        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">

                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            <Video className="h-3.5 w-3.5" />

                            Live tutoring
                          </span>


                          <Link
                            href={`/tutors/${tutor.slug}`}
                            className="group/link inline-flex items-center gap-1.5 text-xs font-bold text-blue-400"
                          >
                            View Profile

                            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                          </Link>

                        </div>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}


            <div className="mt-9 text-center">

              <Link
                href="/courses"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Browse Live Courses

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>

          </div>

        </section>


        {/* ====================================================
            FEATURED SELF-PACED COURSES
        ===================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <SectionHeading
              eyebrow="Learn On Your Schedule"
              title="Featured Self-Paced Courses"
              description="Choose a structured course, work through the lessons at your own pace and monitor your progress as you learn."
              href="/self-paced"
              linkText="Browse All Courses"
              accent="violet"
            />


            {selfPacedCourses.length ===
            0 ? (
              <EmptyState
                icon={
                  Layers
                }
                title="Self-paced courses are coming soon"
                description="New courses are being prepared. Check back shortly."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {selfPacedCourses.map(
                  (
                    course
                  ) => (
                    <Link
                      key={
                        course._id
                      }
                      href={`/self-paced/${course._id}`}
                      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-950/10"
                    >

                      <div className="relative h-44 overflow-hidden bg-white/[0.04] sm:h-48">

                        {course.coverImageUrl ? (
                          <img
                            src={
                              course.coverImageUrl
                            }
                            alt={`${course.title} self-paced course on Loran EduHub`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/60 to-slate-900">
                            <Layers className="h-10 w-10 text-violet-500/40" />
                          </div>
                        )}


                        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                          Self-Paced
                        </div>


                        <div className="absolute right-3 top-3">

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-md ${
                              course.isFree
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-950/85 text-white"
                            }`}
                          >
                            {course.isFree
                              ? "Free"
                              : formatMoney(
                                  course.price
                                )}
                          </span>

                        </div>

                      </div>


                      <div className="p-5">

                        <h3 className="line-clamp-2 font-heading text-base font-bold text-white transition group-hover:text-violet-200">
                          {
                            course.title
                          }
                        </h3>

                        <p className="mt-2 text-xs text-slate-500">
                          By{" "}
                          {
                            course.tutorName
                          }
                        </p>


                        <div className="mt-4 flex items-center justify-between gap-3">

                          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                            <BookOpen className="h-3.5 w-3.5" />

                            {
                              course.weekCount
                            }{" "}
                            week
                            {course.weekCount !==
                            1
                              ? "s"
                              : ""}
                          </span>


                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300">
                            <Award className="h-3.5 w-3.5" />

                            Certificate
                          </span>

                        </div>


                        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">

                          <span className="text-xs font-bold text-slate-300">
                            View Course
                          </span>

                          <ChevronRight className="h-4 w-4 text-violet-400 transition-transform group-hover:translate-x-1" />

                        </div>

                      </div>

                    </Link>
                  )
                )}

              </div>
            )}

          </div>

        </section>


        {/* ====================================================
            EXAM PREP PROMO
        ===================================================== */}

        <section className="border-y border-white/[0.06] bg-white/[0.02] py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-cyan-950/80 via-blue-950/70 to-slate-950 p-6 sm:p-9 lg:p-12">

              <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-cyan-400/20 blur-[100px]" />


              <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">

                <div>

                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Exam Preparation
                  </span>

                  <h2 className="mt-3 max-w-2xl font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                    Don't Just Read for Your Exam.{" "}
                    <span className="text-cyan-300">
                      Practise for It.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                    Build familiarity with exam-style questions,
                    test your knowledge and discover areas that
                    need more attention before the real exam.
                  </p>


                  <div className="mt-6 flex flex-wrap gap-2">

                    {[
                      "JAMB",
                      "WAEC",
                      "NECO",
                      "Multiple Subjects",
                      "Exam Practice",
                    ].map(
                      (
                        item
                      ) => (
                        <span
                          key={item}
                          className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-[11px] font-medium text-cyan-100"
                        >
                          {item}
                        </span>
                      )
                    )}

                  </div>


                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                    <Link
                      href="/exam-prep/register"
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                    >
                      Start Exam Prep

                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>


                    <Link
                      href="/courses"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                    >
                      Find an Exam Tutor
                    </Link>

                  </div>

                </div>


                {/* Visual grid */}

                <div className="grid grid-cols-2 gap-3 sm:gap-4">

                  <ExamCard
                    icon={
                      BrainCircuit
                    }
                    title="Practise"
                    text="Answer exam-style questions."
                  />

                  <ExamCard
                    icon={
                      Target
                    }
                    title="Identify"
                    text="Discover your weaker areas."
                    raised
                  />

                  <ExamCard
                    icon={
                      TrendingUp
                    }
                    title="Improve"
                    text="Build confidence through repetition."
                  />

                  <ExamCard
                    icon={
                      Trophy
                    }
                    title="Prepare"
                    text="Walk into exam day more ready."
                    raised
                  />

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            LESSON NOTES
        ===================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <SectionHeading
              eyebrow="Study Resources"
              title="Featured Lesson Notes"
              description="Find structured learning resources created by tutors for study, revision and classroom support."
              href="/lesson-notes"
              linkText="Browse All Notes"
              accent="amber"
            />


            {lessonNotes.length ===
            0 ? (
              <EmptyState
                icon={
                  FileText
                }
                title="New lesson notes are being added"
                description="Check back shortly for more learning resources."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {lessonNotes.map(
                  (
                    note
                  ) => (
                    <Link
                      key={
                        note._id
                      }
                      href={`/lesson-notes/${note._id}`}
                      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-950/10"
                    >

                      <div className="relative h-44 overflow-hidden bg-white/[0.04] sm:h-48">

                        {note.coverImageUrl ? (
                          <img
                            src={
                              note.coverImageUrl
                            }
                            alt={`${note.title} lesson note on Loran EduHub`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-950/40 to-slate-900">
                            <FileText className="h-10 w-10 text-amber-500/40" />
                          </div>
                        )}


                        <div className="absolute right-3 top-3">

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              note.isFree
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-950/85 text-white"
                            }`}
                          >
                            {note.isFree
                              ? "Free"
                              : formatMoney(
                                  note.price
                                )}
                          </span>

                        </div>

                      </div>


                      <div className="p-5">

                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-400">
                          {
                            note.subject ||
                            "Lesson Note"
                          }
                        </p>


                        <h3 className="mt-2 line-clamp-2 font-heading text-base font-bold text-white transition group-hover:text-amber-200">
                          {
                            note.title
                          }
                        </h3>


                        <p className="mt-2 text-xs text-slate-500">
                          By{" "}
                          {
                            note.tutorName
                          }
                        </p>


                        <div className="mt-4 flex items-center justify-between gap-3">

                          <span className="text-[11px] text-slate-400">
                            {note.studentClass
                              ? note.studentClass.toUpperCase()
                              : "All Levels"}
                          </span>


                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                            <Download className="h-3.5 w-3.5" />

                            Study Resource
                          </span>

                        </div>


                        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">

                          <span className="text-xs font-bold text-slate-300">
                            View Note
                          </span>

                          <ChevronRight className="h-4 w-4 text-amber-400 transition-transform group-hover:translate-x-1" />

                        </div>

                      </div>

                    </Link>
                  )
                )}

              </div>
            )}

          </div>

        </section>


        {/* ====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="border-y border-white/[0.06] bg-white/[0.02] py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

            <div className="mx-auto mb-12 max-w-2xl text-center">

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                Start Learning
              </span>

              <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
                Your Next Skill Is Only a Few Steps Away
              </h2>

            </div>


            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">

              <div className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-blue-500/20 via-violet-500/30 to-blue-500/20 md:block" />


              <ProcessStep
                number="01"
                title="Choose Your Goal"
                description="Decide what you want to achieve — learn a language, build a skill, prepare for an exam or study a school subject."
              />

              <ProcessStep
                number="02"
                title="Choose How to Learn"
                description="Learn directly with a live tutor, enrol in a self-paced course, practise exams or access lesson notes."
              />

              <ProcessStep
                number="03"
                title="Learn, Practise & Grow"
                description="Complete lessons, assessments and learning activities while building knowledge you can use beyond the platform."
              />

            </div>

          </div>

        </section>


        {/* ====================================================
            PLATFORM BENEFITS
        ===================================================== */}

        <section className="py-16 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mx-auto mb-10 max-w-2xl text-center">

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                One Learning Platform
              </span>

              <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
                Designed Around Real Learning
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Useful tools for students who want to learn and
                tutors who want to teach effectively.
              </p>

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {PLATFORM_FEATURES.map(
                (
                  feature
                ) => {
                  const Icon =
                    feature.icon;

                  return (
                    <div
                      key={
                        feature.title
                      }
                      className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-blue-500/25 hover:bg-white/[0.04] sm:p-6"
                    >

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-600 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>


                      <h3 className="mt-4 font-heading text-base font-bold text-white">
                        {
                          feature.title
                        }
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {
                          feature.description
                        }
                      </p>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </section>


        {/* ====================================================
            TUTOR CTA
        ===================================================== */}

        <section className="border-y border-white/[0.06] bg-white/[0.02] py-16 sm:py-20">

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

            <div className="grid gap-8 rounded-[28px] border border-white/[0.08] bg-slate-900/70 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">

              <div>

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-400">
                  For Tutors
                </span>

                <h2 className="mt-3 font-heading text-2xl font-bold text-white sm:text-3xl">
                  Turn What You Know Into Learning Opportunities.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Teach live courses, create self-paced
                  programmes, publish lesson notes, manage your
                  students and build a stronger digital teaching
                  presence from one platform.
                </p>

              </div>


              <Link
                href="/auth/tutor/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-violet-500"
              >
                Apply as a Tutor

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

            </div>

          </div>

        </section>


        {/* ====================================================
            FINAL CTA
        ===================================================== */}

        <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">

          <div className="pointer-events-none absolute left-1/2 bottom-0 h-[350px] w-[750px] max-w-full -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />


          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
              <Rocket className="h-6 w-6 text-blue-300" />
            </div>


            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Start Building Your Future
            </p>


            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              What Would You Like to Learn Next?
            </h2>


            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">

              Your next language, technical skill, exam result
              or career opportunity can start with one decision:
              begin learning.

            </p>


            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

              <Link
                href="/courses"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 sm:w-auto"
              >
                Explore Live Courses

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>


              <Link
                href="/self-paced"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.09] sm:w-auto"
              >
                Learn at Your Own Pace
              </Link>

            </div>


            <p className="mt-5 text-[11px] text-slate-600">
              Live tutoring • Self-paced learning • Exam
              preparation • Lesson notes
            </p>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText,
  accent = "blue",
}: {
  eyebrow: string;

  title: string;

  description: string;

  href: string;

  linkText: string;

  accent?:
    | "blue"
    | "violet"
    | "amber";
}) {
  const accentClass =
    accent ===
    "violet"
      ? "text-violet-400"
      : accent ===
          "amber"
        ? "text-amber-400"
        : "text-blue-400";

  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

      <div className="max-w-2xl">

        <span
          className={`text-xs font-bold uppercase tracking-[0.18em] ${accentClass}`}
        >
          {eyebrow}
        </span>

        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
          {description}
        </p>

      </div>


      <Link
        href={href}
        className={`group inline-flex shrink-0 items-center gap-2 text-sm font-bold ${accentClass}`}
      >
        {linkText}

        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>

    </div>
  );
}

// ============================================================
// CAREER CARD
// ============================================================

function CareerCard({
  icon: Icon,
  title,
  description,
  raised = false,
}: {
  icon: any;

  title: string;

  description: string;

  raised?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5 ${
        raised
          ? "mt-5"
          : ""
      }`}
    >

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-blue-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 font-heading text-lg font-bold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-indigo-100/60">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// EXAM CARD
// ============================================================

function ExamCard({
  icon: Icon,
  title,
  text,
  raised = false,
}: {
  icon: any;

  title: string;

  text: string;

  raised?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur sm:p-5 ${
        raised
          ? "mt-5"
          : ""
      }`}
    >

      <Icon className="h-6 w-6 text-cyan-300" />

      <p className="mt-5 font-heading text-lg font-bold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {text}
      </p>

    </div>
  );
}

// ============================================================
// PROCESS STEP
// ============================================================

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;

  title: string;

  description: string;
}) {
  return (
    <div className="relative text-center">

      <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
        <span className="font-heading text-lg font-bold text-blue-400">
          {number}
        </span>
      </div>


      <h3 className="mt-5 font-heading text-lg font-bold text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;

  title: string;

  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-slate-500">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-300">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}