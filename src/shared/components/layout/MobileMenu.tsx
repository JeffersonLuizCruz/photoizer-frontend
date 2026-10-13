import { useMemo, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { LogOut, Moon, Search, Sun, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useThemeStore } from '@/stores/theme.store'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  getVisibleEntries,
  isNavItem,
  type NavGroup,
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
  const [query, setQuery] = useState('')

  const entries = getVisibleEntries(papel)

  const topLevel = useMemo(() => entries.filter(isNavItem), [entries])
  const groups = useMemo(() => entries.filter((entry): entry is NavGroup => !isNavItem(entry)), [entries])
  const flatItems = useMemo(() => {
    const items: NavItem[] = []
    entries.forEach((entry) => {
      if (isNavItem(entry)) items.push(entry)
      else items.push(...entry.children)
    })
    return items
  }, [entries])

  const normalizedQuery = query.trim().toLowerCase()
  const results = normalizedQuery
    ? flatItems.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
    : null

  const close = () => setOpen(false)

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
                placeholder="Buscar módulo..."
                type="search"
                enterKeyHint="search"
                aria-label="Buscar módulo"
                className="pl-9"
              />
            </div>
          </div>

          <nav
            className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            aria-label="Menu de navegação"
          >
            {results ? (
              results.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Nenhum módulo encontrado
                </p>
              ) : (
                <MenuGrid items={results} onNavigate={close} />
              )
            ) : (
              <>
                <section className="space-y-2">
                  <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Principal
                  </h2>
                  <MenuGrid items={topLevel} onNavigate={close} />
                </section>

                {groups.map((group) => (
                  <section key={group.label} className="space-y-2">
                    <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </h2>
                    <MenuGrid items={group.children} onNavigate={close} />
                  </section>
                ))}
              </>
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

function MenuGrid({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <MenuTile key={item.to} item={item} onNavigate={onNavigate} />
      ))}
    </div>
  )
}

function MenuTile({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'border-primary/60 bg-primary/5 text-primary'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-medium leading-tight">{item.label}</span>
    </NavLink>
  )
}
