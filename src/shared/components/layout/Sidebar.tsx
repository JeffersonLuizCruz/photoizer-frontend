import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/constants'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useIsTablet } from '@/shared/hooks/use-media-query'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  getVisibleEntries,
  isNavItem,
  type NavGroup,
} from '@/shared/lib/navigation'

export function Sidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const setOpen = useSidebarStore((state) => state.setOpen)
  const mobileOpen = useSidebarStore((state) => state.mobileOpen)
  const closeMobile = useSidebarStore((state) => state.closeMobile)
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen)
  const isTablet = useIsTablet()
  const { papel } = useAuth()
  const location = useLocation()
  const entries = getVisibleEntries(papel)
  const showLabels = isTablet ? mobileOpen : isOpen
  const drawerOpen = isTablet && mobileOpen
  const asideRef = useRef<HTMLElement>(null)

  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({
    Financeiro: location.pathname.startsWith(ROUTES.FINANCEIRO),
    Parceiros: location.pathname.startsWith(ROUTES.FOTOGRAFOS),
  })

  useEffect(() => {
    if (location.pathname.startsWith(ROUTES.FINANCEIRO)) {
      setGroupsOpen((prev) => ({ ...prev, Financeiro: true }))
    }
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname.startsWith(ROUTES.FOTOGRAFOS) || location.pathname.startsWith(ROUTES.REPASSES_PENDENTES)) {
      setGroupsOpen((prev) => ({ ...prev, 'Parceiros': true }))
    }
  }, [location.pathname])

  useEffect(() => {
    if (isTablet && mobileOpen) {
      closeMobile()
    }
  }, [location.pathname, isTablet, mobileOpen, closeMobile])

  useEffect(() => {
    if (!drawerOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    asideRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawerOpen, closeMobile])

  const handleGroupClick = (label: string) => {
    if (!showLabels) {
      if (isTablet) {
        setMobileOpen(true)
      } else {
        setOpen(true)
      }
      setGroupsOpen((prev) => ({ ...prev, [label]: true }))
      return
    }
    setGroupsOpen((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isGroupActive = (group: NavGroup) => group.children.some((child) => location.pathname === child.to)

  return (
    <aside
      id="app-sidebar"
      ref={asideRef}
      role={drawerOpen ? 'dialog' : undefined}
      aria-modal={drawerOpen ? 'true' : undefined}
      aria-label={drawerOpen ? 'Menu de navegação' : undefined}
      tabIndex={drawerOpen ? -1 : undefined}
      className={cn(
        'border-r bg-card flex flex-col transition-all duration-300 focus:outline-none',
        isTablet
          ? cn('fixed inset-y-0 left-0 z-50 w-60', mobileOpen ? 'translate-x-0' : '-translate-x-full')
          : cn(isOpen ? 'w-60' : 'w-16'),
      )}
    >
      <div className={cn('flex h-14 items-center border-b px-4', showLabels ? 'justify-start' : 'justify-center')}>
        {showLabels ? (
          <span className="font-bold text-lg">Photoizer</span>
        ) : (
          <span className="font-bold text-lg">P</span>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1" aria-label="Menu de navegação">
        {entries.map((entry) => {
          if (isNavItem(entry)) {
            const Icon = entry.icon
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                end={entry.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    showLabels ? 'justify-start' : 'justify-center',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {showLabels && <span>{entry.label}</span>}
              </NavLink>
            )
          }

          const GroupIcon = entry.icon
          const active = isGroupActive(entry)
          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => handleGroupClick(entry.label)}
                aria-expanded={showLabels ? !!groupsOpen[entry.label] : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  showLabels ? 'justify-start' : 'justify-center',
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <GroupIcon className="h-5 w-5 shrink-0" />
                {showLabels && (
                  <>
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', groupsOpen[entry.label] && 'rotate-180')}
                    />
                  </>
                )}
              </button>
              {showLabels && (
                <div
                  className={cn(
                    'grid transition-all duration-200',
                    groupsOpen[entry.label] ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
                      {entry.children.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            end={child.end}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                              )
                            }
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            <span>{child.label}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}