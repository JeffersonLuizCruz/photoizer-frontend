import { useMemo, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronDown, LogOut, Moon, Search, Sun, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useThemeStore } from '@/stores/theme.store'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  getVisibleEntries,
  isNavItem,
  type NavItem,
} from '@/shared/lib/navigation'

const papelConfig = {
  ADMIN: { label: 'Admin', variant: 'default' as const },
  FOTOGRAFO: { label: 'Fotógrafo', variant: 'info' as const },
  EDITOR: { label: 'Editor', variant: 'secondary' as const },
  AGENDADOR: { label: 'Agendador', variant: 'warning' as const },
}

export function MobileMenu() {
  const open = useSidebarStore((state) => state.mobileMenuOpen)
  const setOpen = useSidebarStore((state) => state.setMobileMenuOpen)
  const { papel, user, logout } = useAuth()
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({})

  const entries = getVisibleEntries(papel)

  const flatItems = useMemo(() => {
    const items: NavItem[] = []
    entries.forEach((entry) => {
      if (isNavItem(entry)) items.push(entry)
      else entry.children.forEach((child) => items.push(child))
    })
    return items
  }, [entries])

  const normalizedQuery = query.trim().toLowerCase()
  const results = normalizedQuery
    ? flatItems.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
    : null

  const close = () => setOpen(false)

  const isGroupOpen = (label: string, children: NavItem[]) =>
    groupsOpen[label] ??
    children.some(
      (child) => location.pathname === child.to || location.pathname.startsWith(`${child.to}/`),
    )

  const papelInfo = user?.papel ? papelConfig[user.papel] : null

  const initials =
    user?.nome
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-background focus:outline-none"
          aria-label="Menu de navegação"
        >
          <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>

          <div className="flex items-center justify-between gap-2 border-b px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
            <span className="font-bold text-lg">Photoizer</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Alternar tema"
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              <DialogPrimitive.Close
                aria-label="Fechar menu"
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="border-b p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no menu..."
                type="search"
                enterKeyHint="search"
                aria-label="Buscar no menu"
                className="pl-9"
              />
            </div>
          </div>

          <nav
            className="flex-1 overflow-y-auto overscroll-contain p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
            aria-label="Menu de navegação"
          >
            {results ? (
              <div className="flex flex-col gap-1">
                {results.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhum item encontrado
                  </p>
                )}
                {results.map((item) => (
                  <MenuLink key={item.to} item={item} onNavigate={close} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {entries.map((entry) => {
                  if (isNavItem(entry)) {
                    return <MenuLink key={entry.to} item={entry} onNavigate={close} />
                  }

                  const GroupIcon = entry.icon
                  const groupOpen = isGroupOpen(entry.label, entry.children)
                  return (
                    <div key={entry.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setGroupsOpen((prev) => ({ ...prev, [entry.label]: !groupOpen }))
                        }
                        aria-expanded={groupOpen}
                        className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <GroupIcon className="h-5 w-5 shrink-0" />
                        <span className="flex-1 text-left">{entry.label}</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform',
                            groupOpen && 'rotate-180',
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          'grid transition-all duration-200',
                          groupOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
                            {entry.children.map((child) => (
                              <MenuLink key={child.to} item={child} onNavigate={close} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </nav>

          {user && (
            <div className="border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <div className="mb-2 flex items-center gap-3 px-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                {papelInfo && (
                  <Badge variant={papelInfo.variant} className="shrink-0 text-[10px]">
                    {papelInfo.label}
                  </Badge>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  close()
                  logout()
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Sair
              </button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function MenuLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )
}
