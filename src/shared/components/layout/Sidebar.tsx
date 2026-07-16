import { LayoutDashboard, Users, Calendar, DollarSign, ListTodo } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/constants'
import { useSidebarStore } from '@/stores/sidebar.store'

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.CLIENTES, label: 'Clientes', icon: Users },
  { to: ROUTES.AGENDA, label: 'Agenda', icon: Calendar },
  { to: ROUTES.TAREFAS, label: 'Tarefas', icon: ListTodo },
  { to: ROUTES.FINANCEIRO, label: 'Financeiro', icon: DollarSign },
]

export function Sidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen)

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
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isOpen ? 'justify-start' : 'justify-center',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
