import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ProfileSettings from "@/components/tutor/ProfileSettings";
import CourseManagement from "@/components/tutor/CourseManagement";
import TutorPricingSettings from "@/components/settings/TutorPricingSettings";
import ThemeToggle from "@/components/shared/ThemeToggle";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";
import DangerZone from "@/components/shared/DangerZone";
import { Palette } from "lucide-react";

export default async function TutorSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tutor") {
    redirect("/auth/tutor/login");
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your profile, courses, pricing, and account.
          </p>
        </div>

        <ProfileSettings />
        <CourseManagement />
        <TutorPricingSettings />

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how Loran EduHub looks on this device.</p>
          <ThemeToggle />
        </div>

        <ChangePasswordForm />

        <DangerZone
          endpoint="/api/tutor/account"
          warningText="Permanently delete your tutor account. This cannot be undone. You must have no actively enrolled students to proceed."
          extraNote="If you still have active students, this will fail — please contact support to transfer them first."
        />
      </div>
    </div>
  );
}