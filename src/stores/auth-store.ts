import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { getMoverByUserId } from '@/lib/db'
import type { Mover } from '@/lib/db'
import type { User } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  mover: Mover | null
  isMover: boolean
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  loadMoverProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  mover: null,
  isMover: false,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  loadMoverProfile: async () => {
    const { user } = get()
    if (!user) {
      set({ mover: null, isMover: false })
      return
    }
    try {
      const mover = await getMoverByUserId(user.id)
      set({ mover, isMover: !!mover })
    } catch {
      set({ mover: null, isMover: false })
    }
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, mover: null, isMover: false })
  },
}))
