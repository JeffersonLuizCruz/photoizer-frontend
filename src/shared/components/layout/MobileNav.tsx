import { MoreHorizontal } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth/AuthProvider'
import { useSidebarStore } from '@/stores/sidebar.store'
import { getMobileTabs } from '@/shared/lib/navigation'

export function MobileNav() {
  const { papel } = useAuth()
  const mobileOpen = useSidebarStore((state) => state.mobileOpen)
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen)
  const location = useLocation()
  const tabs = getMobileTabs(papel)

  const isMaisActive = !tabs.some((tab) =>
    tab.end ? location.pathname === tab.to : location.pathname.startsWith(tab.to),
  )

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="w-full max-w-full truncate px-1 text-center">{tab.label}</span>
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu com mais opções"
          aria-expanded={mobileOpen}
          className={cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
            isMaisActive ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="w-full max-w-full truncate px-1 text-center">Mais</span>
        </button>
      </div>
    </nav>
  )
}