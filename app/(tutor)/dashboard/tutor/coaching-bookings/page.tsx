import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CoachingBookingsInbox from "@/components/tutor/CoachingBookingsInbox";

export default async function CoachingBookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") redirect("/auth/tutor/login");
  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Coaching Bookings</h1>
        <CoachingBookingsInbox />
      </div>
    </div>
  );
}