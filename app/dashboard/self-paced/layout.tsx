// app/dashboard/self-paced/layout.tsx

import SelfPacedSidebar from '@/components/self-paced/SelfPacedSidebar'

export default function SelfPacedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SelfPacedSidebar />

      <main className="min-h-screen pt-14 lg:pl-60 lg:pt-0">
        {children}
      </main>
    </div>
  )
}