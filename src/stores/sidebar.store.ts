import { create } from 'zustand'

interface SidebarState {
  isOpen: boolean
  mobileOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  setMobileOpen: (open: boolean) => void
  closeMobile: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  mobileOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setMobileOpen: (open) => set({ mobileOpen: open }),
  closeMobile: () => set({ mobileOpen: false }),
}))
