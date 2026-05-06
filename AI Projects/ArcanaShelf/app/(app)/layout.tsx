import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col max-w-lg mx-auto">
      <div className="flex-1 pb-20">{children}</div>
      <BottomNav />
    </div>
  )
}
