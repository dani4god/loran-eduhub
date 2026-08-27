// components/examprep/ExamPrepDiscordCTA.tsx
'use client'
import Link from 'next/link'
import { MessageSquare, GraduationCap, Sparkles } from 'lucide-react'

export function StudyWithTutorAd() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><GraduationCap size={16} className="text-blue-600" /></div>
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1">Want more than practice questions?</p>
          <p className="text-xs text-gray-600 mb-2">Study with a real tutor on Loran EduHub — structured lessons, exams, and 1-on-1 support.</p>
          <Link href="/auth/student/register" className="inline-block text-xs font-semibold text-blue-600 hover:underline">Register with a Tutor →</Link>
        </div>
      </div>
    </div>
  )
}

export function JoinDiscordAd() {
  return (
    <div className="bg-indigo-600 rounded-2xl p-4 mt-3 text-center">
      <MessageSquare className="w-6 h-6 text-white mx-auto mb-2" />
      <p className="text-sm font-bold text-white mb-1">Join Our Exam Prep Community</p>
      <p className="text-xs text-indigo-100 mb-3">Get your questions answered instantly by professional tutors, receive instant assistance, and get university & scholarship updates.</p>
      <Link href="/exam-prep/discord" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 rounded-lg text-xs font-semibold">Join Community</Link>
    </div>
  )
}