'use client'
import { useParams } from 'next/navigation'
import CourseViewer from '@/components/self-paced/CourseViewer'

export default function Page() {
  const params = useParams()
  return <CourseViewer courseId={params.id as string} />
}