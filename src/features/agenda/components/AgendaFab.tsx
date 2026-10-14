import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface AgendaFabProps {
  onClick: () => void
  label?: string
}

/**
 * Botão de ação flutuante da agenda (mobile). Fica acima da barra de navegação
 * inferior e respeita a safe-area do PWA.
 */
export function AgendaFab({ onClick, label = 'Nova proposta' }: AgendaFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-testid="agenda-fab"
      className={cn(
        'fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform',
        'hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
      style={{ bottom: 'calc(var(--nav-h) + 1rem + env(safe-area-inset-bottom))' }}
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
    </button>
  )
}
