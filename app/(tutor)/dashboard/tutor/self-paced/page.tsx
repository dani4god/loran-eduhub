import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SelfPacedCoursesList from "@/components/tutor/SelfPacedCoursesList";

export default async function TutorSelfPacedPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/auth/tutor/login");
  return <SelfPacedCoursesList />;
}