'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">L</span>
            </div>
            <span className="font-heading font-bold text-lg text-brand-dark">
              Loran <span className="text-brand-primary">EduHub</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === link.href
                    ? 'text-brand-primary'
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Student Login */}
            <Link
              href="/auth/student/login"
              className="px-4 py-2 text-sm font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-student-light transition-colors duration-200"
            >
              Student Login
            </Link>
            {/* Tutor Login */}
            <Link
              href="/auth/tutor/login"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Tutor Login
            </Link>
            {/* Student Sign Up */}
            <Link
              href="/auth/student/register"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 bg-current transition-all duration-300 ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${isMobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-student-light text-brand-primary'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
            <Link
              href="/auth/student/login"
              onClick={() => setIsMobileOpen(false)}
              className="py-2.5 text-center text-sm font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-student-light transition-colors"
            >
              Student Login
            </Link>
            <Link
              href="/auth/tutor/login"
              onClick={() => setIsMobileOpen(false)}
              className="py-2.5 text-center text-sm font-medium text-white bg-brand-secondary rounded-lg hover:bg-purple-700 transition-colors"
            >
              Tutor Login
            </Link>
            <Link
              href="/auth/student/register"
              onClick={() => setIsMobileOpen(false)}
              className="col-span-2 py-2.5 text-center text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/tutor/register"
              onClick={() => setIsMobileOpen(false)}
              className="col-span-2 py-2.5 text-center text-sm font-medium text-brand-secondary border border-brand-secondary rounded-lg hover:bg-tutor-light transition-colors"
            >
              Apply as Tutor
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
