import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MyReviews from '@/components/student/MyReviews'

export default async function StudentReviewsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    redirect('/auth/student/login')
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Rate and review the tutors you've learned with.
          </p>
        </div>
        <MyReviews />
      </div>
    </div>
  )
}