'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BrainCircuit, ClipboardList, History, LogOut, Menu, Target, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import { useExamPrepStudent } from '@/hooks/useExamPrepStudent'

const links = [
  { href: '/exam-prep/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/exam-prep/dashboard/take', label: 'Practice Exam', icon: ClipboardList },
  { href: '/exam-prep/dashboard/analytics', label: 'AI Performance', icon: BrainCircuit },
  { href: '/exam-prep/dashboard/live-exams', label: 'Exam Arena', icon: Trophy },
  { href: '/exam-prep/dashboard/mistakes', label: 'Mistake Bank', icon: Target },
  { href: '/exam-prep/dashboard/history', label: 'History', icon: History },
]

export default function ExamPrepSidebar() {
  const pathname = usePathname()
  const { student, logout } = useExamPrepStudent()
  const [open, setOpen] = useState(false)

  const nav = (
    <>
      <div className="border-b border-slate-800 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">Loran EduHub</p>
        <p className="mt-1 text-lg font-bold text-white">Exam Prep</p>
      </div>

      <div className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === '/exam-prep/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-slate-800 p-4">
        {student && (
          <div className="mb-3">
            <p className="truncate text-sm font-semibold text-white">{student.fullName}</p>
            <p className="text-[10px] text-slate-500">{student.regNumber}</p>
          </div>
        )}
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-300">
          <LogOut size={15} /> Log out
        </button>
      </div>
    </>
  )

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 rounded-xl bg-slate-950 p-2.5 text-white lg:hidden">
        <Menu size={20} />
      </button>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 lg:flex">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-slate-950">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 p-2 text-slate-400"><X size={18} /></button>
            {nav}
          </aside>
        </div>
      )}
    </>
  )
}
