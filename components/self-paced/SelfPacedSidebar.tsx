// components/self-paced/SelfPacedSidebar.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  ShoppingBag,
  X,
} from 'lucide-react'

const navItems = [
  {
    name: 'My Courses',
    href: '/dashboard/self-paced',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'WhatsApp Mentor',
    href: '/dashboard/self-paced/mentor',
    icon: MessageCircle,
  },
  {
    name: 'Discord',
    href: '/dashboard/self-paced/discord',
    icon: MessageSquare,
  },
  {
    name: 'Purchase Another Course',
    href: '/dashboard/self-paced/purchase',
    icon: ShoppingBag,
  },
]

export default function SelfPacedSidebar() {
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] =
    useState(false)

  function isActive(
    href: string,
    exact?: boolean
  ) {
    if (exact) {
      return pathname === href
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    )
  }

  function handleLogout() {
    void signOut({
      callbackUrl: '/',
    })
  }

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}

      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 lg:hidden">
        <button
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          className="rounded-lg p-2 text-gray-200 transition hover:bg-gray-800 hover:text-white"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <GraduationCap
            size={17}
            className="text-blue-400"
          />

          <span className="text-sm font-bold text-white">
            Loran EduHub
          </span>
        </div>

        <div className="w-9" />
      </div>

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-gray-900 text-white lg:flex">
        {/* BRAND */}

        <div className="flex items-center gap-2 border-b border-gray-800 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/15">
            <GraduationCap
              size={18}
              className="text-blue-400"
            />
          </div>

          <div>
            <span className="block text-sm font-bold">
              Loran EduHub
            </span>

            <span className="text-[10px] text-gray-500">
              Self-Paced Learning
            </span>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(
            (item) => {
              const active =
                isActive(
                  item.href,
                  item.exact
                )

              const Icon =
                item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? 'bg-blue-600 font-medium text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon
                    size={16}
                    className="shrink-0"
                  />

                  <span>
                    {item.name}
                  </span>
                </Link>
              )
            }
          )}
        </nav>

        {/* LOGOUT */}

        <div className="border-t border-gray-800 p-4">
          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-300 transition hover:bg-red-600/20 hover:text-red-400"
          >
            <LogOut
              size={16}
            />

            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 lg:hidden ${
          mobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        {/* BACKDROP */}

        <div
          className="absolute inset-0 bg-black/50"
          onClick={() =>
            setMobileOpen(false)
          }
        />

        {/* DRAWER */}

        <aside
          className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-gray-900 text-white shadow-2xl transition-transform duration-200 ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }`}
        >
          {/* MOBILE BRAND */}

          <div className="flex items-center justify-between border-b border-gray-800 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/15">
                <GraduationCap
                  size={18}
                  className="text-blue-400"
                />
              </div>

              <div>
                <span className="block text-sm font-bold">
                  Loran EduHub
                </span>

                <span className="text-[10px] text-gray-500">
                  Self-Paced Learning
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="rounded-lg p-2 text-gray-300 transition hover:bg-gray-800 hover:text-white"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          {/* MOBILE NAVIGATION */}

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(
              (item) => {
                const active =
                  isActive(
                    item.href,
                    item.exact
                  )

                const Icon =
                  item.icon

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    onClick={() =>
                      setMobileOpen(
                        false
                      )
                    }
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? 'bg-blue-600 font-medium text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={16}
                      className="shrink-0"
                    />

                    <span>
                      {
                        item.name
                      }
                    </span>
                  </Link>
                )
              }
            )}
          </nav>

          {/* MOBILE LOGOUT */}

          <div className="border-t border-gray-800 p-4">
            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-300 transition hover:bg-red-600/20 hover:text-red-400"
            >
              <LogOut
                size={16}
              />

              Logout
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}