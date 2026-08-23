// components/shared/UserGuideContent.tsx
'use client'

import { useState } from 'react'
import {
  BookOpen, LayoutDashboard, GraduationCap, Award, FileQuestion, ClipboardList,
  MessageSquare, CreditCard, Settings, Users, Megaphone, Star, ChevronDown,
  Layers, Calendar, Share2, HelpCircle,
} from 'lucide-react'

interface Section {
  icon: any
  title: string
  items: { subtitle: string; body: string }[]
}

const STUDENT_SECTIONS: Section[] = [
  {
    icon: LayoutDashboard, title: 'Overview / Dashboard',
    items: [
      { subtitle: 'What it shows', body: 'Your profile summary, a countdown card for each course subscription (showing time remaining and renewal status), quick stats (courses, exams, average score), your enrolled courses, upcoming exams, and recent grades.' },
      { subtitle: 'Renewal warnings', body: 'If any subscription is expiring within 5 days or has already expired, you\'ll see a highlighted "Renew" button on that course\'s card. Renewing before expiry adds the new period on top of your remaining time — you never lose paid-for days.' },
    ],
  },
  {
    icon: BookOpen, title: 'My Courses',
    items: [
      { subtitle: 'What it shows', body: 'Every course you\'re actively enrolled in, along with your tutor for each, plan type, and status (active, paused, expired).' },
    ],
  },
  {
    icon: Layers, title: 'Course Library',
    items: [
      { subtitle: 'How it works', body: 'Tutors build structured lesson material — chapters, topics, and subtopics — with text, links, embedded videos, and revision questions. Content unlocks sequentially: you must view and answer the questions for one unit before the next unlocks.' },
    ],
  },
  {
    icon: FileQuestion, title: 'Exams',
    items: [
      { subtitle: 'Taking an exam', body: 'Exams are graded instantly the moment you submit — multiple choice, true/false, and fill-in-the-gap questions are all auto-graded. Once submitted, an exam cannot be retaken.' },
    ],
  },
  {
    icon: ClipboardList, title: 'Assignments',
    items: [
      { subtitle: 'Submitting', body: 'Assignments are reviewed manually by your tutor. Once graded, your score appears in Scores. You can only submit once per assignment per enrollment.' },
    ],
  },
  {
    icon: Award, title: 'Scores & Certificates',
    items: [
      { subtitle: 'Scores', body: 'Shows your exam and assignment results per course, plus your combined average.' },
      { subtitle: 'Certificates', body: 'Once you have enough graded work, your tutor can issue a certificate showing your classification — Distinction (80%+), Credit (60–79%), or Pass (45–59%). You can correct your name on it once before downloading.' },
    ],
  },
  {
    icon: CreditCard, title: 'Enroll & Renew',
    items: [
      { subtitle: 'Enroll & Withdraw', body: 'Add additional courses (with a new tutor if you like), or withdraw from a course you no longer want — withdrawal is immediate and non-refundable for remaining time.' },
      { subtitle: 'Renew Subscription', body: 'Renew any course before or after it expires. A countdown badge turns red when 5 days or fewer remain.' },
    ],
  },
  {
    icon: Star, title: 'Reviews',
    items: [
      { subtitle: 'Leaving a review', body: 'Once enrolled in a course (even on trial), you can rate your tutor and leave a comment. Reviews appear publicly on the tutor\'s profile.' },
    ],
  },
  {
    icon: Megaphone, title: 'Notifications',
    items: [
      { subtitle: 'Announcements', body: 'Tutors post class schedules and updates here. New announcements also pop up once on your dashboard until you acknowledge them.' },
    ],
  },
  {
    icon: MessageSquare, title: 'Discord',
    items: [
      { subtitle: 'Why it matters', body: 'All live teaching happens on Discord. Connect your account here to automatically receive the correct course and plan roles — this updates automatically as your enrollments change.' },
    ],
  },
  {
    icon: Settings, title: 'Settings',
    items: [
      { subtitle: 'What you can change', body: 'Profile details, password, dark/light mode, and — in the Danger Zone — permanently delete your account.' },
    ],
  },
]

const TUTOR_SECTIONS: Section[] = [
  {
    icon: LayoutDashboard, title: 'Overview / Dashboard',
    items: [
      { subtitle: 'What it shows', body: 'Your student count, active enrollments, total earnings, and recent activity — new enrollments, withdrawals, etc.' },
    ],
  },
  {
    icon: Users, title: 'Students',
    items: [
      { subtitle: 'What it shows', body: 'Every student enrolled with you, grouped by person (a student in 2 of your courses appears once, with both courses listed). Click into a student to see their full enrollment and grade history with you specifically.' },
    ],
  },
  {
    icon: FileQuestion, title: 'Exams',
    items: [
      { subtitle: 'Creating exams', body: 'Build exams with MCQ, true/false, and fill-in-the-gap questions. Exams are auto-graded the moment a student submits — there is no manual grading step for exams.' },
    ],
  },
  {
    icon: ClipboardList, title: 'Assignments',
    items: [
      { subtitle: 'Grading', body: 'Assignments require you to manually review and score each submission — unlike exams, these do need your input before a student sees a grade.' },
    ],
  },
  {
    icon: Award, title: 'Grading Center',
    items: [
      { subtitle: 'What it shows', body: 'A combined view of student averages across exams and assignments together, plus a queue of assignments still awaiting your grade, and exam submission history.' },
    ],
  },
  {
    icon: Layers, title: 'Course Library',
    items: [
      { subtitle: 'Building content', body: 'Create structured, chapter-by-chapter lesson material with rich text, images, links, and embedded YouTube/Loom videos. Add revision questions per unit — students must answer them to unlock the next unit.' },
    ],
  },
  {
    icon: Award, title: 'Certificates',
    items: [
      { subtitle: 'Issuing', body: 'View which students are eligible (enough graded work, not withdrawn or failing) and issue a certificate. Set your signature and logo once in Certificate Settings — used on every certificate you issue.' },
    ],
  },
  {
    icon: Megaphone, title: 'Announcements',
    items: [
      { subtitle: 'Posting', body: 'Post updates or class schedules to a specific course\'s students. You can attach links (e.g. "Join Class Here") and optionally set a specific date/time.' },
    ],
  },
  {
    icon: Layers, title: 'Self-Paced Courses',
    items: [
      { subtitle: 'What they are', body: 'Udemy-style, self-paced versions of a course you already teach — students purchase once and progress week by week at their own speed.' },
      { subtitle: 'Building one', body: 'Each week can have multiple pages of content (text, images, embedded videos), followed by a timed exam. Students need 70%+ to unlock the next week, with 3 attempts before the course locks (you can unlock it manually from Students).' },
      { subtitle: 'Publishing', body: 'A new course starts as a Draft. Submitting sends it to our admin team for review — it only becomes publicly visible after approval. Once published, it\'s locked from editing; unpublish first if you need to make changes, then resubmit.' },
      { subtitle: 'Coaching & Discord', body: 'Optionally offer paid 1-on-1 coaching (set your hourly rate and available time slots), and/or a free weekly Discord workshop — both shown to students inside the course.' },
    ],
  },
  {
    icon: Calendar, title: 'Coaching Bookings',
    items: [
      { subtitle: 'Managing bookings', body: 'When a self-paced student books and pays for a session, it appears here. Reply with a class link either via WhatsApp (their number is shown) or directly from your dashboard.' },
    ],
  },
  {
    icon: CreditCard, title: 'Payments',
    items: [
      { subtitle: 'How you get paid', body: 'Every student payment (course enrollment or coaching session) is logged here after our platform fee is deducted, showing as "pending" until our admin team confirms it\'s been paid out to your bank account.' },
    ],
  },
  {
    icon: Share2, title: 'Discord & Feedback',
    items: [
      { subtitle: 'Discord', body: 'Connect your account to get your tutor role automatically, based on the categories of courses you teach.' },
      { subtitle: 'Feedback', body: 'When a student withdraws from your course, their stated reason and any feedback they left appear here.' },
    ],
  },
  {
    icon: Settings, title: 'Settings',
    items: [
      { subtitle: 'Profile & Pricing', body: 'Update your bio, profile photo, and set your own pricing per plan (monthly, 3/6/12-month). Price changes only apply to new enrollments.' },
      { subtitle: 'Bank Details', body: 'Set the bank account payouts are sent to — protected by an email verification code before changes take effect.' },
      { subtitle: 'Social & Campaigns', body: 'Add links to your live classes or socials, and post promotional updates that appear on your public tutor profile — with one-click sharing to Twitter/X, Facebook, or WhatsApp.' },
    ],
  },
]

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)
  const Icon = section.icon

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">{section.title}</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {section.items.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-gray-700 mb-1">{item.subtitle}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function UserGuideContent({ role }: { role: 'student' | 'tutor' }) {
  const sections = role === 'tutor' ? TUTOR_SECTIONS : STUDENT_SECTIONS

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">
            {role === 'tutor' ? 'Tutor' : 'Student'} User Guide
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Everything on your dashboard, explained. Tap any section to expand it.
        </p>

        <div className="space-y-2.5">
          {sections.map((s) => <AccordionSection key={s.title} section={s} />)}
        </div>
      </div>
    </div>
  )
}