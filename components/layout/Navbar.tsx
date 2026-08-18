'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'



export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/tutors', label: 'Tutors' },
    { href: '/courses', label: 'Courses' },
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
    { href: '/self-paced', label: 'Self-Paced' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gray-950/90 backdrop-blur-md ${
        isScrolled ? 'shadow-lg shadow-black/20 border-b border-white/10' : 'border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Logo />

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === link.href ? 'text-blue-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              href="/auth/student/login"
              className="px-3.5 py-2 text-sm font-medium text-blue-300 border border-blue-400/30 rounded-lg hover:bg-blue-500/10 hover:border-blue-400/50 transition-all"
            >
              Student Login
            </Link>
            <Link
              href="/auth/tutor/login"
              className="px-3.5 py-2 text-sm font-medium text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-500/10 hover:border-purple-400/50 transition-all"
            >
              Tutor Login
            </Link>
            <Link
              href="/auth/student/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isMobileOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-gray-950 border-t border-white/10 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-white/10 grid grid-cols-2 gap-2">
            <Link
              href="/auth/student/login"
              onClick={() => setIsMobileOpen(false)}
              className="py-2.5 text-center text-sm font-medium text-blue-300 border border-blue-400/30 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              Student Login
            </Link>
            <Link
              href="/auth/tutor/login"
              onClick={() => setIsMobileOpen(false)}
              className="py-2.5 text-center text-sm font-medium text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-500/10 transition-colors"
            >
              Tutor Login
            </Link>
            <Link
              href="/auth/student/register"
              onClick={() => setIsMobileOpen(false)}
              className="col-span-2 py-2.5 text-center text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/tutor/register"
              onClick={() => setIsMobileOpen(false)}
              className="col-span-2 py-2.5 text-center text-sm font-medium text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-500/10 transition-colors"
            >
              Apply as Tutor
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}