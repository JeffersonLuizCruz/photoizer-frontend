import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useIsTablet } from '@/shared/hooks/use-media-query'

export function AppLayout() {
  const mobileOpen = useSidebarStore((state) => state.mobileOpen)
  const closeMobile = useSidebarStore((state) => state.closeMobile)
  const isTablet = useIsTablet()

  return (
    <div className="flex h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow"
      >
        Pular para o conteúdo
      </a>

      {isTablet && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] focus:outline-none sm:px-6 sm:pt-6 lg:pb-6"
        >
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}