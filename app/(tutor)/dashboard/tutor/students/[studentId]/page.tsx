// app/(tutor)/dashboard/tutor/students/[studentId]/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import StudentDetails from "@/components/tutor/StudentDetails";
import { getStudentDetails } from "@/lib/actions/tutor";
import { authOptions } from "@/lib/auth";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const { studentId } = await params;

  const studentData = await getStudentDetails(studentId, session.user.email);

  // Redirects both when the student doesn't exist AND when this tutor has
  // no enrollment relationship with them — getStudentDetails now scopes
  // enrollments/grades to the requesting tutor, so a student with zero
  // matching enrollments here means "not this tutor's student," not just
  // "no data yet."
  if (!studentData || studentData.enrollments.length === 0) {
    redirect("/dashboard/tutor/students");
  }

  return (
    <div className="space-y-6">
      <StudentDetails student={studentData} />
    </div>
  );
}