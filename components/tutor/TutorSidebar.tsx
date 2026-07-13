// components/tutor/TutorSidebar.tsx
"use client";
import { ClipboardList } from 'lucide-react'
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
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Bell,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard/tutor", icon: LayoutDashboard },
  { name: "My Students", href: "/dashboard/tutor/students", icon: Users },
  { name: "Exams", href: "/dashboard/tutor/exams", icon: FileQuestion },
  { name: "Grades", href: "/dashboard/tutor/grades", icon: BarChart3 },
  { name: "Discord", href: "/dashboard/tutor/discord", icon: MessageSquare },
  { name: "Settings", href: "/dashboard/tutor/settings", icon: Settings },
  { name: 'Assignments', href: '/dashboard/tutor/assignments', icon: ClipboardList },
];

export default function TutorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: "/" 
      });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <aside
        className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col h-full shadow-2xl ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo Section */}
        <div className={`relative p-6 border-b border-white/10 ${isCollapsed ? "px-4" : ""}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Loran EduHub
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">Tutor Portal</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsed Toggle Button */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-gray-700 rounded-full p-1 shadow-lg hover:bg-gray-600 transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white shadow-lg" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                <div className={`relative ${isActive ? "animate-pulse" : ""}`}>
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-purple-400" : ""}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                  )}
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                    {isActive && (
                      <div className="w-1 h-6 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full" />
                    )}
                  </>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* Notification Bell (Optional) */}
          {!isCollapsed && (
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-white/10 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="text-sm">Notifications</span>
              <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
              text-gray-300 hover:bg-red-500/20 hover:text-red-400
              ${isCollapsed ? "justify-center" : ""}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            )}
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>

          {/* User Info (Optional) */}
          {!isCollapsed && (
            <div className="pt-3 mt-2 border-t border-white/10">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">DT</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Daniel Tutor</p>
                  <p className="text-xs text-gray-400">Instructor</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is expanded */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}