
'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

interface AdminNavbarProps {
  onMenuClick: () => void;
}

const TITLES: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/tutors': 'Tutors',
  '/admin/students': 'Students',
  '/admin/enrollments': 'Enrollments',
  '/admin/tickets': 'Support Tickets',
  '/admin/payments': 'Payments',
  '/admin/admins': 'Admins',
  '/admin/settings': 'Settings',
};

export default function AdminNavbar({
  onMenuClick,
}: AdminNavbarProps) {
  const pathname = usePathname();
  const title = TITLES[pathname || ''] || 'Admin';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-sm font-semibold text-gray-900">
          {title}
        </h1>
      </div>
    </header>
  );
}