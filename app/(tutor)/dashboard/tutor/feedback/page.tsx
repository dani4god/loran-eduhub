import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FeedbackList from "@/components/tutor/FeedbackList";

export default async function TutorFeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") {
    redirect("/auth/tutor/login");
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Withdrawal Feedback</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Notices from students who've withdrawn from your courses.
          </p>
        </div>
        <FeedbackList />
      </div>
    </div>
  );
}