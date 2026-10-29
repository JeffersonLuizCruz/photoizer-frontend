import { LayoutGrid } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/constants'
import { useAuth } from '@/features/auth/AuthProvider'
import { useEntregasPendentes } from '@/shared/hooks/useEntregasPendentes'
import { useGaleriasPendentes } from '@/shared/hooks/useGaleriasPendentes'
import { useSidebarStore } from '@/stores/sidebar.store'
import { getMobileTabs } from '@/shared/lib/navigation'

export function MobileNav() {
  const { papel, user } = useAuth()
  const mobileMenuOpen = useSidebarStore((state) => state.mobileMenuOpen)
  const setMobileMenuOpen = useSidebarStore((state) => state.setMobileMenuOpen)
  const location = useLocation()
  const tabs = getMobileTabs(papel)
  const podeVerDashboard = tabs.some((tab) => tab.to === ROUTES.DASHBOARD)
  const { quantidade: entregasPendentes } = useEntregasPendentes({
    enabled: podeVerDashboard && !!user,
    userId: user?.userId,
  })
  const podeVerGalerias = tabs.some((tab) => tab.to === ROUTES.GALERIAS)
  const { total: galeriasPendentes } = useGaleriasPendentes({
    enabled: podeVerGalerias && !!user,
    userId: user?.userId,
    papel,
  })

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
          const contador =
            tab.to === ROUTES.DASHBOARD
              ? entregasPendentes
              : tab.to === ROUTES.GALERIAS
                ? galeriasPendentes
                : 0
          const contadorLabel =
            tab.to === ROUTES.DASHBOARD
              ? 'entrega(s) pendente(s)'
              : 'pendência(s) em Galerias'
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              aria-label={contador > 0 ? `${tab.label} (${contador} ${contadorLabel})` : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {contador > 0 && (
                      <span
                        title={`${contador} ${contadorLabel}`}
                        className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white"
                      >
                        {contador > 99 ? '99+' : contador}
                      </span>
                    )}
                  </span>
                  <span className="w-full max-w-full truncate px-1 text-center">{tab.shortLabel ?? tab.label}</span>
                </>
              )}
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu completo"
          aria-expanded={mobileMenuOpen}
          className={cn(
            'flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            isMaisActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
          )}
        >
          <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="w-full max-w-full truncate px-1 text-center">Menu</span>
        </button>
      </div>
    </nav>
  )
}