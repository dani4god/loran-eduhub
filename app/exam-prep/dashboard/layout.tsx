import ExamPrepSidebar from '@/components/examprep/ExamPrepSidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <ExamPrepSidebar />
      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">{children}</main>
    </div>
  )
}
