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

  const studentData = await getStudentDetails(studentId);

  if (!studentData) {
    redirect("/dashboard/tutor/students");
  }

  return (
    <div className="space-y-6">
      <StudentDetails student={studentData} />
    </div>
  );
}