// components/tutor/TutorSidebar.tsx
"use client";
import { BookOpen, ClipboardList } from 'lucide-react'
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  FileQuestion,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Inbox,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Bell,
  Menu,
  X,
  Megaphone,
  ScrollText,
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard/tutor", icon: LayoutDashboard },
  { name: "My Students", href: "/dashboard/tutor/students", icon: Users },
  { name: "Exams", href: "/dashboard/tutor/exams", icon: FileQuestion },
  { name: "Grades", href: "/dashboard/tutor/grades", icon: BarChart3 },
  { name: "Discord", href: "/dashboard/tutor/discord", icon: MessageSquare },
  { name: 'Assignments', href: '/dashboard/tutor/assignments', icon: ClipboardList },
  { name: 'Course Library', href: '/dashboard/tutor/library', icon: BookOpen },
  { name: "Feedback", href: "/dashboard/tutor/feedback", icon: Inbox },
  { name: "Create Certificate", href: "/dashboard/tutor/certificates", icon: ScrollText },
  { name: "Announcements", href: "/dashboard/tutor/announcements", icon: Megaphone },
  { name: "Settings", href: "/dashboard/tutor/settings", icon: Settings },
];

interface TutorSidebarProps {
  tutorName?: string;
}

export default function TutorSidebar({ tutorName }: TutorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = tutorName
    ? tutorName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'T';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false, callbackUrl: "/" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      {/* Logo Section */}
      <div className={`relative p-6 border-b border-white/10 ${collapsed ? "px-4" : ""}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                  Loran EduHub
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">Tutor Portal</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:block p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white shadow-lg"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-blue-400" : ""}`} />

              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                  {isActive && (
                    <div className="w-1 h-6 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-full shrink-0" />
                  )}
                </>
              )}

              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg hidden lg:block">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 p-4 space-y-3">
        {!collapsed && (
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-white/10 rounded-xl transition-colors">
            <Bell className="w-5 h-5 shrink-0" />
            <span className="text-sm">Notifications</span>
            <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`
            w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
            text-gray-300 hover:bg-red-500/20 hover:text-red-400
            ${collapsed ? "justify-center" : ""}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoggingOut ? (
            <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <LogOut className="w-5 h-5 shrink-0" />
          )}
          {!collapsed && (
            <span className="text-sm font-medium">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          )}
        </button>

        {!collapsed && (
          <div className="pt-3 mt-2 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{tutorName || 'Tutor'}</p>
                <p className="text-xs text-gray-400">Instructor</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-gray-900 border-b border-white/10 flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-200"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Loran EduHub</span>
        </div>
        <div className="w-9" /> {/* spacer to balance the menu button */}
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out flex-col h-full shadow-2xl relative ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent collapsed={isCollapsed} />
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-3 top-20 bg-gray-700 rounded-full p-1 shadow-lg hover:bg-gray-600 transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent collapsed={false} />
        </aside>
      </div>
    </>
  );
}