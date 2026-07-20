import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MyCertificates from '@/components/student/MyCertificates'

export default async function MyCertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    redirect('/auth/student/login')
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Certificates of completion issued by your tutors.
          </p>
        </div>
        <MyCertificates />
      </div>
    </div>
  )
}