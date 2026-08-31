// components/tutor/TutorSidebar.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

import {
  LayoutDashboard,
  Users,
  FileQuestion,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Inbox,
  FileText,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Menu,
  Layers3,
  HelpCircle,
  X,
  Megaphone,
  ScrollText,
  Wallet,
  ClipboardList,
  BookOpen,
  ChevronDown,
  PanelLeftClose,
  CalendarDays,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: any;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      {
        name: "Overview",
        href: "/dashboard/tutor",
        icon: LayoutDashboard,
      },
      {
        name: "My Students",
        href: "/dashboard/tutor/students",
        icon: Users,
      },
      {
        name: "Payments",
        href: "/dashboard/tutor/payments",
        icon: Wallet,
      },
    ],
  },

  {
    title: "Teaching",
    items: [
      {
        name: "Course Library",
        href: "/dashboard/tutor/library",
        icon: BookOpen,
      },
      {
        name: "Assignments",
        href: "/dashboard/tutor/assignments",
        icon: ClipboardList,
      },
      {
        name: "Exams",
        href: "/dashboard/tutor/exams",
        icon: FileQuestion,
      },
      {
        name: "Grades",
        href: "/dashboard/tutor/grades",
        icon: BarChart3,
      },
      {
        name: "Certificates",
        href: "/dashboard/tutor/certificates",
        icon: ScrollText,
      },
    ],
  },

  {
    title: "Self-Paced",
    items: [
      {
        name: "Self-Paced Courses",
        href: "/dashboard/tutor/self-paced",
        icon: Layers3,
      },
      {
        name: "Coaching Bookings",
        href: "/dashboard/tutor/coaching-bookings",
        icon: CalendarDays,
      },
      {
        name: "Sell Lesson Notes",
        href: "/dashboard/tutor/lesson-notes",
        icon: FileText,
      },
    ],
  },

  {
    title: "Engagement",
    items: [
      {
        name: "Announcements",
        href: "/dashboard/tutor/announcements",
        icon: Megaphone,
      },
      {
        name: "Discord",
        href: "/dashboard/tutor/discord",
        icon: MessageSquare,
      },
      {
        name: "Feedback",
        href: "/dashboard/tutor/feedback",
        icon: Inbox,
      },
    ],
  },
];

const bottomNavigation: NavItem[] = [
  {
    name: "Settings",
    href: "/dashboard/tutor/settings",
    icon: Settings,
  },
  {
    name: "User Guide",
    href: "/dashboard/guide",
    icon: HelpCircle,
  },
];

interface TutorSidebarProps {
  tutorName?: string;
}

export default function TutorSidebar({
  tutorName,
}: TutorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] =
    useState(false);

  const [isMobileOpen, setIsMobileOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [expandedGroups, setExpandedGroups] =
    useState<Record<string, boolean>>({
      Workspace: true,
      Teaching: true,
      "Self-Paced": true,
      Engagement: true,
    });

  const initials = useMemo(() => {
    if (!tutorName) return "T";

    return tutorName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [tutorName]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const isItemActive = (href: string) => {
    if (href === "/dashboard/tutor") {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname?.startsWith(`${href}/`)
    );
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await signOut({
        redirect: false,
        callbackUrl: "/",
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const NavigationItem = ({
    item,
    collapsed,
  }: {
    item: NavItem;
    collapsed: boolean;
  }) => {
    const active = isItemActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        title={collapsed ? item.name : undefined}
        className={`
          group relative flex min-h-[42px] items-center rounded-xl
          transition-all duration-200
          ${
            collapsed
              ? "justify-center px-2"
              : "gap-3 px-3"
          }
          ${
            active
              ? "bg-blue-600 text-white shadow-sm shadow-blue-950/20"
              : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
          }
        `}
      >
        <Icon
          className={`
            h-[18px] w-[18px] shrink-0 transition-colors
            ${
              active
                ? "text-white"
                : "text-slate-400 group-hover:text-white"
            }
          `}
        />

        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
            {item.name}
          </span>
        )}

        {active && !collapsed && (
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        )}

        {collapsed && (
          <div
            className="
              pointer-events-none absolute left-full z-[70] ml-3
              hidden whitespace-nowrap rounded-lg border border-slate-700
              bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white
              opacity-0 shadow-xl transition-opacity
              group-hover:opacity-100 lg:block
            "
          >
            {item.name}
          </div>
        )}
      </Link>
    );
  };

  const SidebarContent = ({
    collapsed,
    mobile = false,
  }: {
    collapsed: boolean;
    mobile?: boolean;
  }) => {
    return (
      <>
        {/* Brand */}

        <div
          className={`
            flex h-[72px] shrink-0 items-center border-b border-white/[0.07]
            ${
              collapsed
                ? "justify-center px-3"
                : "px-4"
            }
          `}
        >
          <Link
            href="/dashboard/tutor"
            className={`
              flex min-w-0 items-center
              ${
                collapsed
                  ? "justify-center"
                  : "gap-3"
              }
            `}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-950/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold tracking-tight text-white">
                  Loran EduHub
                </p>

                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Tutor Workspace
                </p>
              </div>
            )}
          </Link>

          {mobile && (
            <button
              type="button"
              onClick={() =>
                setIsMobileOpen(false)
              }
              aria-label="Close navigation"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {!mobile && !collapsed && (
            <button
              type="button"
              onClick={() =>
                setIsCollapsed(true)
              }
              aria-label="Collapse sidebar"
              className="ml-auto hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:flex"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <nav className="space-y-5">
            {navGroups.map((group) => {
              const groupIsOpen =
                expandedGroups[group.title] !==
                false;

              return (
                <div key={group.title}>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() =>
                        toggleGroup(group.title)
                      }
                      className="mb-1.5 flex w-full items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                    >
                      <span>{group.title}</span>

                      <ChevronDown
                        className={`
                          h-3.5 w-3.5 transition-transform
                          ${
                            groupIsOpen
                              ? ""
                              : "-rotate-90"
                          }
                        `}
                      />
                    </button>
                  )}

                  {(collapsed || groupIsOpen) && (
                    <div className="space-y-1">
                      {group.items.map(
                        (item) => (
                          <NavigationItem
                            key={item.href}
                            item={item}
                            collapsed={collapsed}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer navigation */}

        <div className="shrink-0 border-t border-white/[0.07] p-3">
          <div className="space-y-1">
            {bottomNavigation.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                collapsed={collapsed}
              />
            ))}
          </div>

          {!collapsed && (
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {tutorName || "Tutor"}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Instructor account
                  </p>
                </div>

                <ThemeToggle />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={
              collapsed
                ? "Logout"
                : undefined
            }
            className={`
              group mt-2 flex min-h-[42px] w-full items-center rounded-xl
              text-slate-400 transition-all duration-200
              hover:bg-red-500/10 hover:text-red-300
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                collapsed
                  ? "justify-center px-2"
                  : "gap-3 px-3"
              }
            `}
          >
            {isLoggingOut ? (
              <span className="h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
            ) : (
              <LogOut className="h-[18px] w-[18px] shrink-0" />
            )}

            {!collapsed && (
              <span className="text-[13px] font-medium">
                {isLoggingOut
                  ? "Logging out..."
                  : "Logout"}
              </span>
            )}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Mobile header */}

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() =>
            setIsMobileOpen(true)
          }
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/dashboard/tutor"
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>

          <div>
            <p className="text-sm font-bold leading-none text-slate-900">
              Loran EduHub
            </p>

            <p className="mt-1 text-[9px] font-medium uppercase tracking-wider text-slate-400">
              Tutor
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/tutor/payments"
          aria-label="Payments"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
        >
          <Wallet className="h-5 w-5" />
        </Link>
      </header>

      {/* Desktop sidebar */}

      <aside
        className={`
          relative hidden h-screen shrink-0 flex-col
          border-r border-slate-800 bg-slate-950 text-white
          shadow-xl transition-[width] duration-300 lg:flex
          ${
            isCollapsed
              ? "w-[76px]"
              : "w-[252px]"
          }
        `}
      >
        <SidebarContent
          collapsed={isCollapsed}
        />

        {isCollapsed && (
          <button
            type="button"
            onClick={() =>
              setIsCollapsed(false)
            }
            aria-label="Expand sidebar"
            className="absolute -right-3 top-20 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-lg transition hover:bg-slate-800 hover:text-white"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        {!isCollapsed && (
          <button
            type="button"
            onClick={() =>
              setIsCollapsed(true)
            }
            aria-label="Collapse sidebar"
            className="absolute -right-3 top-20 z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-lg transition hover:bg-slate-800 hover:text-white xl:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </aside>

      {/* Mobile drawer */}

      <div
        className={`
          fixed inset-0 z-50 lg:hidden
          ${
            isMobileOpen
              ? "pointer-events-auto"
              : "pointer-events-none"
          }
        `}
        aria-hidden={!isMobileOpen}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setIsMobileOpen(false)
          }
          className={`
            absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]
            transition-opacity duration-300
            ${
              isMobileOpen
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        <aside
          className={`
            absolute inset-y-0 left-0 flex w-[286px] max-w-[88vw]
            flex-col bg-slate-950 text-white shadow-2xl
            transition-transform duration-300 ease-out
            ${
              isMobileOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          <SidebarContent
            collapsed={false}
            mobile
          />
        </aside>
      </div>
    </>
  );
}