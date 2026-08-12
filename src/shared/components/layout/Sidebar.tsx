import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  Calendar,
  ChevronDown,
  DollarSign,
  FileBarChart2,
  FileSignature,
  Image,
  LayoutDashboard,
  Package,
  Percent,
  ReceiptText,
  Settings,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/constants'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useAuth, type Papel } from '@/features/auth/AuthProvider'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  end?: boolean
}

interface NavGroup {
  label: string
  icon: React.ElementType
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

const financeiroGroup: NavGroup = {
  label: 'Financeiro',
  icon: DollarSign,
  children: [
    { to: ROUTES.FINANCEIRO, label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: ROUTES.FINANCEIRO_RECEITAS, label: 'Receitas', icon: ReceiptText },
    { to: ROUTES.FINANCEIRO_DESPESAS, label: 'Despesas', icon: ArrowDownLeft },
    { to: ROUTES.FINANCEIRO_FLUXO_CAIXA, label: 'Fluxo de Caixa', icon: Wallet },
    { to: ROUTES.FINANCEIRO_RELATORIOS, label: 'Relatórios', icon: FileBarChart2 },
  ],
}

const navEntries: NavEntry[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.AGENDA, label: 'Agenda', icon: Calendar },
  { to: ROUTES.PACOTES, label: 'Pacotes', icon: Package },
  { to: ROUTES.EDICAO, label: 'Edição', icon: Image },
  { to: ROUTES.ADMIN_ECOMMERCE, label: 'Ecommerce', icon: ShoppingCart },
  { to: ROUTES.CONTRATOS, label: 'Contratos', icon: FileSignature },
  { to: ROUTES.COMISSOES, label: 'Comissões', icon: Percent },
  financeiroGroup,
  { to: ROUTES.CONFIG, label: 'Configurações', icon: Settings },
]

const agendadorRoutes = new Set<string>([
  ROUTES.AGENDA,
  ROUTES.PACOTES,
  ROUTES.EDICAO,
  ROUTES.COMISSOES,
  ROUTES.CONTRATOS,
])

function isNavItem(entry: NavEntry): entry is NavItem {
  return 'to' in entry
}

function getVisibleEntries(papel: Papel | null): NavEntry[] {
  if (papel !== 'AGENDADOR') return navEntries
  return navEntries.filter((entry) =>
    isNavItem(entry)
      ? agendadorRoutes.has(entry.to)
      : entry.children.some((child) => agendadorRoutes.has(child.to)),
  )
}

export function Sidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const setOpen = useSidebarStore((state) => state.setOpen)
  const { papel } = useAuth()
  const location = useLocation()
  const entries = getVisibleEntries(papel)

  const financeiroActive = location.pathname.startsWith(ROUTES.FINANCEIRO)
  const [groupOpen, setGroupOpen] = useState(financeiroActive)

  useEffect(() => {
    if (financeiroActive) setGroupOpen(true)
  }, [financeiroActive])

  const handleGroupClick = () => {
    if (!isOpen) {
      setOpen(true)
      setGroupOpen(true)
      return
    }
    setGroupOpen((value) => !value)
  }

  const isGroupActive = (group: NavGroup) => group.children.some((child) => location.pathname === child.to)

  return (
    <aside
      className={cn(
        'border-r bg-card flex flex-col transition-all duration-300',
        isOpen ? 'w-60' : 'w-16',
      )}
    >
      <div className={cn('flex h-14 items-center border-b px-4', isOpen ? 'justify-start' : 'justify-center')}>
        {isOpen ? (
          <span className="font-bold text-lg">Photoizer</span>
        ) : (
          <span className="font-bold text-lg">P</span>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
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
                onClick={handleGroupClick}
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
                      className={cn('h-4 w-4 shrink-0 transition-transform', groupOpen && 'rotate-180')}
                    />
                  </>
                )}
              </button>
              {isOpen && (
                <div
                  className={cn(
                    'grid transition-all duration-200',
                    groupOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
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
