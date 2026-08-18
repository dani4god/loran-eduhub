import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SelfPacedCourseBuilder from "@/components/tutor/SelfPacedCourseBuilder";

export default async function EditSelfPacedCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/auth/tutor/login");
  return <SelfPacedCourseBuilder courseId={id} />;
}