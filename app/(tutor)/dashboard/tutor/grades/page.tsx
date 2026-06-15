// app/(tutor)/dashboard/grades/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import GradesList from "@/components/tutor/GradesList";
import { getTutorExamsForGrading } from "@/lib/actions/tutor";
import { authOptions } from "@/lib/auth";


export default async function GradesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const examsToGrade = await getTutorExamsForGrading(session.user.email);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Grades
          </h1>
          <p className="text-gray-600 mt-2">
            Grade student submissions and upload grades
          </p>
        </div>

        <Link
          href="/dashboard/grades/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center"
        >
          Bulk Upload Grades
        </Link>
      </div>

      <GradesList exams={examsToGrade ?? []} />
    </div>
  );
}