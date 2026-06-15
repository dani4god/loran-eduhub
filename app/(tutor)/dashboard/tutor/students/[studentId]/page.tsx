// app/(tutor)/dashboard/students/[studentId]/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import StudentDetails from "@/components/tutor/StudentDetails";
import { getStudentDetails } from "@/lib/actions/tutor";

export default async function StudentDetailPage({
  params,
}: {
  params: { studentId: string };
}) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const studentData = await getStudentDetails(params.studentId);

  if (!studentData) {
    redirect("/dashboard/students");
  }

  return (
    <div className="space-y-6">
      <StudentDetails student={studentData} />
    </div>
  );
}