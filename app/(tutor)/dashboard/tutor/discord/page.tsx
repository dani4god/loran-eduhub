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

  // Ensure the data matches the expected type
  const safeDiscordInfo = {
    discordServerId: discordInfo.discordServerId,
    discordInviteLink: discordInfo.discordInviteLink,
    isConnected: discordInfo.isConnected,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Discord Integration
        </h1>
        <p className="text-gray-600 mt-2">
          Connect your Discord server to automate student role management
        </p>
      </div>

      <DiscordIntegration initialData={safeDiscordInfo} />
    </div>
  );
}