// app/(tutor)/dashboard/exams/create/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ExamForm from "@/components/tutor/ExamForm";
import { getTutorCourses } from "@/lib/actions/tutor";

type SerializedCourse = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  syllabus?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default async function CreateExamPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  // Fetch courses from DB
  const coursesFromDb = await getTutorCourses(session.user.email);

  // Serialize mongoose documents
  const courses: SerializedCourse[] = coursesFromDb.map((course: any) => ({
    _id: course._id.toString(),
    name: course.name,
    description: course.description || "",
    category: course.category || "",
    syllabus: course.syllabus || "",
    isActive: course.isActive ?? true,
    createdAt: course.createdAt
      ? new Date(course.createdAt).toISOString()
      : undefined,
    updatedAt: course.updatedAt
      ? new Date(course.updatedAt).toISOString()
      : undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Create New Exam
        </h1>

        <p className="text-gray-600 mt-2">
          Create a new exam with questions. You can add
          questions individually or upload a CSV file.
        </p>
      </div>

      <ExamForm courses={courses} />
    </div>
  );
}