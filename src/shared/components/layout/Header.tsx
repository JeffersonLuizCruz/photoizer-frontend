import { PanelLeft, Moon, Sun } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useThemeStore } from '@/stores/theme.store'
import { Button } from '@/shared/components/ui/button'

export function Header() {
  const toggle = useSidebarStore((state) => state.toggle)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <header className="border-b bg-card h-14 flex items-center justify-between px-6">
      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle sidebar">
        <PanelLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  )
}
