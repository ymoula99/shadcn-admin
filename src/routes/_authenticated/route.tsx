import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { MoverDashboard } from '@/features/mover-dashboard'
import { useAuthStore } from '@/stores/auth-store'

function AuthenticatedRoute() {
  const isMover = useAuthStore((s) => s.isMover)
  if (isMover) return <MoverDashboard />
  return <AuthenticatedLayout />
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: AuthenticatedRoute,
})
