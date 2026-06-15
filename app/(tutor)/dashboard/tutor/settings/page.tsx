// app/(tutor)/dashboard/tutor/settings/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import TutorSettings from "@/components/tutor/TutorSettings";
import { getTutorSettings } from "@/lib/actions/tutor";
import { authOptions } from "@/lib/auth";
import { Settings, Shield, Bell, UserCircle } from "lucide-react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const settings = await getTutorSettings(session.user.email);

  // Convert Mongo/Mongoose document to plain JSON
  const safeSettings = JSON.parse(JSON.stringify(settings));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section with Gradient - Same as Overview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tutor via-tutor/90 to-brand-primary rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
        <div className="relative px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm mb-4">
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 font-heading">
                Settings
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Manage your account settings, update your profile information, and customize your preferences.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <UserCircle className="w-5 h-5 text-white/90" />
                <span className="text-white/90 text-sm">
                  {safeSettings.firstName} {safeSettings.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickStatCard
          icon={UserCircle}
          title="Profile Status"
          value={safeSettings.firstName && safeSettings.lastName ? "Complete" : "Incomplete"}
          status="complete"
        />
        <QuickStatCard
          icon={Shield}
          title="Security Level"
          value="High"
          status="secure"
        />
        <QuickStatCard
          icon={Bell}
          title="Notifications"
          value="Configured"
          status="info"
        />
      </div>

      {/* Settings Component */}
      <div className="transform transition-all duration-300">
        <TutorSettings initialData={safeSettings} />
      </div>
    </div>
  );
}

// Quick Stat Card Component
function QuickStatCard({ icon: Icon, title, value, status }: any) {
  const getStatusColor = () => {
    switch (status) {
      case "complete":
        return "bg-green-500";
      case "secure":
        return "bg-blue-500";
      case "info":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case "complete":
        return "text-green-600";
      case "secure":
        return "text-blue-600";
      case "info":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const getIconBgColor = () => {
    switch (status) {
      case "complete":
        return "bg-green-100";
      case "secure":
        return "bg-blue-100";
      case "info":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  const getIconColor = () => {
    switch (status) {
      case "complete":
        return "text-green-600";
      case "secure":
        return "text-blue-600";
      case "info":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px]">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${getIconBgColor()} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${getIconColor()}`} />
          </div>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-xl font-bold font-heading ${getStatusTextColor()}`}>
            {value}
          </p>
        </div>
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getStatusColor()} rounded-full transition-all duration-500 group-hover:opacity-80`}
            style={{ width: status === "complete" || status === "secure" ? "100%" : "75%" }}
          />
        </div>
      </div>
    </div>
  );
}