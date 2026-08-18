// components/self-paced/SelfPacedSidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, MessageSquare, LogOut, Menu, X, GraduationCap, ShoppingBag } from 'lucide-react'

const navItems = [
  { name: 'My Courses', href: '/dashboard/self-paced', icon: LayoutDashboard },
  { name: 'Discord', href: '/dashboard/self-paced/discord', icon: MessageSquare },
  { name: 'Purchase Another Course', href: '/self-paced', icon: ShoppingBag },
]

export default function SelfPacedSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-30">
        <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-200"><Menu size={20} /></button>
        <div className="flex items-center gap-2"><GraduationCap size={16} className="text-blue-400" /><span className="text-white font-bold text-sm">Loran EduHub</span></div>
        <div className="w-9" />
      </div>

      <aside className="hidden lg:flex bg-gray-900 text-white w-60 fixed inset-y-0 left-0 z-20 flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2"><GraduationCap size={18} className="text-blue-400" /><span className="font-bold text-sm">Loran EduHub</span></div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <item.icon size={16} /> {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-red-600/20 hover:text-red-400 rounded-xl text-sm"><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <div className={`lg:hidden fixed inset-0 z-40 transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <span className="font-bold text-sm">Loran EduHub</span>
            <button onClick={() => setMobileOpen(false)}><X size={18} /></button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                <item.icon size={16} /> {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 rounded-xl text-sm"><LogOut size={16} /> Logout</button>
          </div>
        </aside>
      </div>
    </>
  )
}