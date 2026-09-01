// app/(tutor)/dashboard/tutor/students/[studentId]/page.tsx

import {
  getServerSession,
} from "next-auth";

import {
  redirect,
} from "next/navigation";

import StudentDetails from "@/components/tutor/StudentDetails";

import {
  getStudentDetails,
} from "@/lib/actions/tutor";

import {
  authOptions,
} from "@/lib/auth";

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{
    studentId: string;
  }>;

  searchParams: Promise<{
    type?: string;
  }>;
}) {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    !session?.user
      ?.email
  ) {
    redirect(
      "/auth/tutor/login"
    );
  }

  const {
    studentId,
  } = await params;

  const query =
    await searchParams;

  const studentType:
    | "regular"
    | "self_paced" =
    query.type ===
    "self_paced"
      ? "self_paced"
      : "regular";

  const studentData =
    await getStudentDetails(
      studentId,
      session.user.email,
      studentType
    );

  if (
    !studentData ||
    studentData
      .enrollments
      .length ===
      0
  ) {
    redirect(
      "/dashboard/tutor/students"
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-0">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <StudentDetails
          student={
            studentData
          }
        />
      </div>
    </div>
  );
}