import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomerUser } from './types'

interface CustomerAuthState {
  user: CustomerUser | null
  isAuthenticated: boolean
  login: (user: CustomerUser) => void
  logout: () => void
  updateUser: (data: Partial<CustomerUser>) => void
}

export const useCustomerAuth = create<CustomerAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    { name: 'photoizer-customer-auth' }
  )
)
