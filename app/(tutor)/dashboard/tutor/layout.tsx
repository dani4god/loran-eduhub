import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TutorSidebar from "@/components/tutor/TutorSidebar";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  console.log("SESSION:", session);

  if (!session || session.user.role !== "tutor") {
    redirect("/auth/tutor/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <TutorSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}