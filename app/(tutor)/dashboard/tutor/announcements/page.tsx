import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AnnouncementsPanel from "@/components/tutor/AnnouncementsPanel";

export default async function TutorAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") {
    redirect("/auth/tutor/login");
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Post updates and class schedules to your students.
          </p>
        </div>
        <AnnouncementsPanel />
      </div>
    </div>
  );
}