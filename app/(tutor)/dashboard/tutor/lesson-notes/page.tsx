// app/(tutor)/dashboard/tutor/lesson-notes/page.tsx
import { getServerSession } from "next-auth"; import { redirect } from "next/navigation"; import { authOptions } from "@/lib/auth"; import LessonNotesList from "@/components/tutor/LessonNotesList";
export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/auth/tutor/login");
  return <LessonNotesList />;
}