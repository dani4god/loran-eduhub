import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CreateCertificatePanel from "@/components/tutor/CreateCertificatePanel";

export default async function TutorCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") {
    redirect("/auth/tutor/login");
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Create Certificate</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Issue a certificate of completion to a student, generated automatically from their grades.
          </p>
        </div>
        <CreateCertificatePanel />
      </div>
    </div>
  );
}