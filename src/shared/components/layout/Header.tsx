import { PanelLeft, Menu, LogOut } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar.store'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/AuthProvider'
import { NotificationBell } from '@/features/notificacoes/components/NotificationBell'

const papelConfig = {
  ADMIN: { label: 'Admin', variant: 'default' as const },
  FOTOGRAFO: { label: 'Fotógrafo', variant: 'info' as const },
  EDITOR: { label: 'Editor', variant: 'secondary' as const },
  AGENDADOR: { label: 'Agendador', variant: 'warning' as const },
}

export function Header() {
  const toggle = useSidebarStore((state) => state.toggle)
  const isOpen = useSidebarStore((state) => state.isOpen)
  const setMobileMenuOpen = useSidebarStore((state) => state.setMobileMenuOpen)
  const { user, logout } = useAuth()

  const initials = user?.nome
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const papel = user?.papel ? papelConfig[user.papel] : null

  return (
    <header className="border-b bg-card min-h-14 flex items-center justify-between px-4 sm:px-6 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Alternar menu lateral"
          aria-expanded={isOpen}
          aria-controls="app-sidebar"
          className="hidden lg:inline-flex"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
                aria-label={`Menu de ${user.nome}`}
                aria-haspopup="menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-sm leading-tight">
                  <span className="font-medium">{user.nome}</span>
                  {papel && (
                    <Badge variant={papel.variant} className="text-[10px] px-1.5 py-0 h-4">
                      {papel.label}
                    </Badge>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
