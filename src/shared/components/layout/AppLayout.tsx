import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { MobileMenu } from './MobileMenu'
import { InstallPrompt } from '@/shared/components/InstallPrompt'

export function AppLayout() {
  return (
    <div className="flex h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow"
      >
        Pular para o conteúdo
      </a>

      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto px-4 pt-4 pb-[calc(var(--nav-h)+1rem+env(safe-area-inset-bottom))] focus:outline-none sm:px-6 sm:pt-6 lg:pb-6"
        >
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <InstallPrompt />
      <MobileMenu />
    </div>
  )
}
