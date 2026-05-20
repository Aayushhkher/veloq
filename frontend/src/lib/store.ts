import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  email: string
  full_name: string
  role: 'user' | 'company' | 'admin'
  is_active: boolean
  is_verified: boolean
  avatar_url?: string
  wallet_balance: number
  total_earned: number
  surveys_completed: number
  upi_id?: string
  created_at: string
  kyc_status?: string
  subscription_tier?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token)
        }
        set({ user, token })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
        }
        set({ user: null, token: null })
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
