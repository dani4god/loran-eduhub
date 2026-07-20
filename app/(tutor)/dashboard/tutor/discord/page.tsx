// app/(tutor)/dashboard/tutor/discord/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DiscordIntegration from "@/components/tutor/DiscordIntegration";
import { getTutorDiscordInfo } from "@/lib/actions/tutor";
import { authOptions } from "@/lib/auth";

export default async function DiscordPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/tutor/login");
  }

  const discordInfo = await getTutorDiscordInfo(session.user.email);

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Discord Integration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect your Discord account to automate your student community and role management.
          </p>
        </div>

        <DiscordIntegration initialData={discordInfo} />
      </div>
    </div>
  );
}