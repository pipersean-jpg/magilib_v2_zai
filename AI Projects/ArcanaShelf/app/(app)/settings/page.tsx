'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'

export default function SettingsPage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Settings" />
      <main className="flex-1 px-4 py-6">
        <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-stone-700">Account</span>
          </div>
          <div className="px-4 py-3">
            <Button variant="danger" size="sm" onClick={handleSignOut} className="w-full">
              Sign out
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
