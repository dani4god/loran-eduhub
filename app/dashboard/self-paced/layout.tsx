import SelfPacedSidebar from '@/components/self-paced/SelfPacedSidebar'

export default function SelfPacedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SelfPacedSidebar />
      <div className="lg:pl-60">{children}</div>
    </div>
  )
}