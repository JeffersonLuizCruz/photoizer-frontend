import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/constants'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  getVisibleEntries,
  isNavItem,
  type NavGroup,
} from '@/shared/lib/navigation'

export function Sidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const setOpen = useSidebarStore((state) => state.setOpen)
  const { papel } = useAuth()
  const location = useLocation()
  const entries = getVisibleEntries(papel)

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

  const handleGroupClick = (label: string) => {
    if (!isOpen) {
      setOpen(true)
      setGroupsOpen((prev) => ({ ...prev, [label]: true }))
      return
    }
    setGroupsOpen((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isGroupActive = (group: NavGroup) => group.children.some((child) => location.pathname === child.to)

  return (
    <aside
      id="app-sidebar"
      aria-label="Menu de navegação"
      className={cn(
        'hidden border-r bg-card lg:flex lg:flex-col lg:transition-all lg:duration-300',
        isOpen ? 'lg:w-60' : 'lg:w-16',
      )}
    >
      <div className={cn('flex h-14 items-center border-b px-4', isOpen ? 'justify-start' : 'justify-center')}>
        {isOpen ? (
          <span className="font-bold text-lg">Photoizer</span>
        ) : (
          <span className="font-bold text-lg">P</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Menu de navegação">
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
                    isOpen ? 'justify-start' : 'justify-center',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isOpen && <span>{entry.label}</span>}
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
                aria-expanded={isOpen ? !!groupsOpen[entry.label] : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isOpen ? 'justify-start' : 'justify-center',
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <GroupIcon className="h-5 w-5 shrink-0" />
                {isOpen && (
                  <>
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', groupsOpen[entry.label] && 'rotate-180')}
                    />
                  </>
                )}
              </button>
              {isOpen && (
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
