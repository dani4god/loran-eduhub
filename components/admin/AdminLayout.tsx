// components/admin/AdminLayout.tsx

"use client";

import {
  useEffect,
} from "react";

import {
  useSession,
} from "next-auth/react";

import {
  useRouter,
} from "next/navigation";

import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const {
    data: session,
    status,
  } = useSession();

  const router =
    useRouter();

  useEffect(() => {
    if (
      status ===
      "unauthenticated"
    ) {
      router.replace(
        "/auth/admin/login"
      );

      return;
    }

    if (
      status ===
        "authenticated" &&
      session?.user?.role !==
        "admin"
    ) {
      router.replace(
        "/unauthorized"
      );
    }
  }, [
    status,
    session,
    router,
  ]);

  if (
    status ===
    "loading"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading admin
            workspace...
          </p>
        </div>
      </div>
    );
  }

  if (
    status !==
      "authenticated" ||
    session?.user?.role !==
      "admin"
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="min-h-screen pt-16 lg:pl-72 lg:pt-0">
        <main className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}