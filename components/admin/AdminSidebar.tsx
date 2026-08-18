// components/admin/AdminSidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CreditCard,
  Settings, Shield, Ticket, Menu, X, LogOut, Wallet,
  Layers,
} from 'lucide-react';

const menuItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/tutors', label: 'Tutors', icon: GraduationCap },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/enrollments', label: 'Enrollments', icon: BookOpen },
  { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/payouts', label: 'Payouts', icon: Wallet },
  { href: '/admin/admins', label: 'Admins', icon: Shield },
  { href: '/admin/self-paced-courses', label: 'Self-Paced Courses', icon: Layers, superAdminOnly: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isItemActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(href + '/');

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ redirect: false });
    router.push('/auth/admin/login');
  };

  const NavList = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {menuItems.map((item) => {
        const active = isItemActive(item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm ${
              active ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-30">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-200">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Loran Admin</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex bg-gray-900 text-white w-64 fixed inset-y-0 left-0 z-20 flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Loran Admin</span>
          </Link>
        </div>
        <NavList />
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-red-400">
                {(session?.user?.name || 'A')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <LogOut size={16} />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-gray-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Loran Admin</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-gray-800">
              <X size={18} className="text-gray-300" />
            </button>
          </div>
          <NavList />
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} /> {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}