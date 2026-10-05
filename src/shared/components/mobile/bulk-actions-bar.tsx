import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface BulkActionsBarProps {
  count: number
  onClear: () => void
  children: ReactNode
  className?: string
}

export function BulkActionsBar({ count, onClear, children, className }: BulkActionsBarProps) {
  if (count === 0) return null

  return (
    <div
      role="region"
      aria-label={`${count} item(ns) selecionado(s)`}
      className={cn(
        'fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 lg:bottom-0',
        className,
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 border-t bg-foreground px-4 py-3 text-background shadow-lg lg:mb-4 lg:rounded-xl lg:border">
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpar seleção"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="shrink-0 text-sm font-semibold">{count} selecionado{count > 1 ? 's' : ''}</span>
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}
