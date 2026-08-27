// app/(tutor)/dashboard/tutor/lesson-notes/[id]/page.tsx
import { getServerSession } from "next-auth"; import { redirect } from "next/navigation"; import { authOptions } from "@/lib/auth"; import LessonNoteBuilder from "@/components/tutor/LessonNoteBuilder";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/auth/tutor/login");
  return <LessonNoteBuilder noteId={id} />;
}