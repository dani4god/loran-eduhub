// app/(tutor)/dashboard/tutor/exams/edit/[examId]/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ExamEditForm from "@/components/tutor/ExamEditForm";
import { authOptions } from "@/lib/auth";

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  // ✅ CORRECT: Await the params Promise first
  const { examId } = await params;

  console.log("Exam ID from params:", examId); // Debug log

  if (!examId) {
    redirect("/dashboard/tutor/exams");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ExamEditForm examId={examId} />
    </div>
  );
}