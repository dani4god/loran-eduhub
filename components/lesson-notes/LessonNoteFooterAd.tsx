// components/lesson-notes/LessonNoteFooterAd.tsx
import Link from 'next/link'
import { Sparkles, Layers, Globe2, MessageSquare, ExternalLink } from 'lucide-react'

const DISCORD_INVITE = 'https://discord.gg/wxV7UfE45V'

export default function LessonNoteFooterAd() {
  return (
    <div className="mt-8 space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-900">More from Loran EduHub</p>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed mb-2">
          We organize <strong>free monthly workshops for tutors</strong> to stay current with the
          latest trends in education and learn how to bring tech tools into their teaching. We also
          offer <strong>self-paced courses</strong> to help you gain or sharpen a skill, and courses
          to learn new languages.
        </p>
        <Link href="/about" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
          Learn more about us <ExternalLink size={11} />
        </Link>
      </div>

      <div className="bg-indigo-600 rounded-2xl p-5 text-center">
        <MessageSquare className="w-6 h-6 text-white mx-auto mb-2" />
        <p className="text-sm font-bold text-white mb-1">Join Our Discord Community</p>
        <p className="text-xs text-indigo-100 mb-3">
          Download Discord on your phone or PC, create a free account, log in, then click below to join our server.
        </p>
        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 rounded-lg text-xs font-semibold">
          Join Server <ExternalLink size={11} />
        </a>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        © {new Date().getFullYear()} Loran EduHub. All rights reserved. This material is the property of Loran EduHub and its tutors.
      </p>
    </div>
  )
}