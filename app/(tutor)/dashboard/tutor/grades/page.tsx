// app/(tutor)/dashboard/grades/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Grading Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Student performance and pending grading, across exams and assignments.
          </p>
        </div>

        <GradesList exams={examsToGrade ?? []} />
      </div>
    </div>
  );
}