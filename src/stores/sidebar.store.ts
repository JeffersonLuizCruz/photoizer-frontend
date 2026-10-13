import { create } from 'zustand'

interface SidebarState {
  isOpen: boolean
  mobileMenuOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  closeMobileMenu: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  mobileMenuOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
}))
