// components/admin/AdminSidebar.tsx

"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  signOut,
  useSession,
} from "next-auth/react";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Settings,
  Shield,
  Ticket,
  Menu,
  X,
  LogOut,
  Wallet,
  Layers,
  FileText,
  Radio,
  FileQuestion,
  ChevronDown,
  School,
  Landmark,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// NAVIGATION
// ============================================================

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const navigationGroups: {
  label: string;
  items: NavigationItem[];
}[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },

  {
    label: "People",
    items: [
      {
        href: "/admin/tutors",
        label: "Tutors",
        icon: GraduationCap,
      },
      {
        href: "/admin/students",
        label: "Students",
        icon: Users,
      },
      {
        href: "/admin/admins",
        label: "Admins",
        icon: Shield,
      },
    ],
  },

  {
    label: "Learning",
    items: [
      {
        href: "/admin/courses",
        label: "Live Courses",
        icon: BookOpen,
      },
      {
        href: "/admin/enrollments",
        label: "Live Enrollments",
        icon: School,
      },
      {
        href: "/admin/self-paced-courses",
        label: "Self-Paced Courses",
        icon: Layers,
      },
      {
        href: "/admin/lesson-notes",
        label: "Lesson Notes",
        icon: FileText,
      },
      {
        href: "/admin/exam-arena",
        label: "Exam Arena",
        icon: Radio,
      },
      {
        href: "/admin/exam-prep",
        label: "Exam Prep",
        icon: FileQuestion,
        exact: true,
      },
      {
        href: "/admin/exam-prep/settings",
        label: "Exam Prep Settings",
        icon: Settings,
      },
    ],
  },

  {
    label: "Finance",
    items: [
      {
        href: "/admin/payments",
        label: "Payments",
        icon: CreditCard,
      },
      {
        href: "/admin/payouts",
        label: "Tutor Payouts",
        icon: Wallet,
      },
    ],
  },

  {
    label: "Operations",
    items: [
      {
        href: "/admin/tickets",
        label: "Support Tickets",
        icon: Ticket,
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

// ============================================================
// COMPONENT
// ============================================================

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: session,
  } = useSession();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [
    collapsedGroups,
    setCollapsedGroups,
  ] = useState<
    Set<string>
  >(new Set());

  // Prevent body scrolling behind mobile drawer
  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isItemActive = (
    href: string,
    exact?: boolean
  ) => {
    if (exact) {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname?.startsWith(
        `${href}/`
      )
    );
  };

  const toggleGroup = (
    label: string
  ) => {
    setCollapsedGroups(
      (
        current
      ) => {
        const next =
          new Set(
            current
          );

        if (
          next.has(label)
        ) {
          next.delete(label);
        } else {
          next.add(label);
        }

        return next;
      }
    );
  };

  const handleLogout =
    async () => {
      try {
        setLoggingOut(true);

        await signOut({
          redirect: false,
        });

        router.push(
          "/auth/admin/login"
        );

        router.refresh();
      } finally {
        setLoggingOut(false);
      }
    };

  const initials =
    (
      session?.user
        ?.name ||
      session?.user
        ?.email ||
      "Admin"
    )
      .trim()
      .charAt(0)
      .toUpperCase();

  const Navigation =
    () => (
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {navigationGroups.map(
            (
              group
            ) => {
              const collapsed =
                collapsedGroups.has(
                  group.label
                );

              return (
                <div
                  key={
                    group.label
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleGroup(
                        group.label
                      )
                    }
                    className="mb-1.5 flex w-full items-center justify-between px-3"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {
                        group.label
                      }
                    </span>

                    <ChevronDown
                      className={`h-3 w-3 text-slate-600 transition-transform ${
                        collapsed
                          ? "-rotate-90"
                          : ""
                      }`}
                    />
                  </button>

                  {!collapsed && (
                    <div className="space-y-1">
                      {group.items.map(
                        (
                          item
                        ) => {
                          const active =
                            isItemActive(
                              item.href,
                              item.exact
                            );

                          const Icon =
                            item.icon;

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
                              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                                active
                                  ? "bg-red-600 text-white shadow-lg shadow-red-950/20"
                                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                              }`}
                            >
                              <Icon
                                size={
                                  17
                                }
                                className={`shrink-0 ${
                                  active
                                    ? "text-white"
                                    : "text-slate-500 transition group-hover:text-slate-300"
                                }`}
                              />

                              <span className="min-w-0 flex-1 truncate font-medium">
                                {
                                  item.label
                                }
                              </span>

                              {active && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                              )}
                            </Link>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </nav>
    );

  const ProfileFooter =
    () => (
      <div className="border-t border-white/[0.07] p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
            <span className="text-sm font-bold text-red-300">
              {initials}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {session?.user
                ?.name ||
                "Administrator"}
            </p>

            <p className="mt-0.5 truncate text-[10px] text-slate-500">
              {
                session?.user
                  ?.email
              }
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            handleLogout
          }
          disabled={
            loggingOut
          }
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <LogOut
            size={15}
          />

          {loggingOut
            ? "Logging out..."
            : "Sign Out"}
        </button>
      </div>
    );

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 lg:hidden">
        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              true
            )
          }
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/[0.06]"
          aria-label="Open admin menu"
        >
          <Menu size={19} />
        </button>

        <Link
          href="/admin"
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-950/30">
            <Shield className="h-4 w-4 text-white" />
          </div>

          <div>
            <p className="text-sm font-bold leading-none text-white">
              Loran Admin
            </p>

            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              Control Centre
            </p>
          </div>
        </Link>

        <div className="h-9 w-9" />
      </header>

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/[0.07] bg-slate-950 text-white lg:flex">
        <div className="border-b border-white/[0.07] px-5 py-5">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-950/30">
              <Shield className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="font-bold tracking-tight text-white">
                Loran Admin
              </p>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Control Centre
              </p>
            </div>
          </Link>
        </div>

        <Navigation />

        <ProfileFooter />
      </aside>

      {/* =====================================================
          MOBILE DRAWER
      ====================================================== */}

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto"
            : "pointer-events-none"
        }`}
      >
        <div
          onClick={() =>
            setMobileOpen(
              false
            )
          }
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        <aside
          className={`absolute inset-y-0 left-0 flex w-[290px] max-w-[88vw] flex-col border-r border-white/[0.08] bg-slate-950 text-white shadow-2xl transition-transform duration-300 ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4">
            <Link
              href="/admin"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700">
                <Shield className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-bold">
                  Loran Admin
                </p>

                <p className="text-[9px] uppercase tracking-wider text-slate-500">
                  Control Centre
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <Navigation />

          <ProfileFooter />
        </aside>
      </div>
    </>
  );
}