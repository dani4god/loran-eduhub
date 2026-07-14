import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import StudentDiscordIntegration from '@/components/discord/StudentDiscordIntegration'

export default async function StudentDiscordPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/auth/student/login')
  }

  await connectDB()
  const student = await Student.findOne({ userId: session.user.id })

  const initialData = {
    discordId: student?.discordId || null,
    discordUsername: student?.discordUsername || null,
    discordRoles: student?.discordRoles || [],
    isConnected: !!student?.discordId,
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Discord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect your Discord account to join course channels and stay
            in sync with your enrollments.
          </p>
        </div>

        <StudentDiscordIntegration initialData={initialData} />
      </div>
    </div>
  )
}