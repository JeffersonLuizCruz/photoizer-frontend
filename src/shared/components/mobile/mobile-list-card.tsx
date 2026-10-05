import { type ReactNode } from 'react'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

interface MobileListCardProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  onClick?: () => void
  selectable?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  className?: string
}

export function MobileListCard({
  leading,
  title,
  subtitle,
  trailing,
  meta,
  actions,
  onClick,
  selectable,
  selected = false,
  onSelectedChange,
  className,
}: MobileListCardProps) {
  const headerContent = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-tight">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </>
  )

  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-colors',
        selected && 'border-primary/60 bg-primary/5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <div className="flex h-11 items-center">
            <Checkbox
              checked={selected}
              onCheckedChange={(value) => onSelectedChange?.(value === true)}
              aria-label="Selecionar item"
            />
          </div>
        )}

        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {headerContent}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-start gap-3">{headerContent}</div>
        )}
      </div>

      {meta && <div className="mt-3">{meta}</div>}

      {actions && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">{actions}</div>
      )}
    </div>
  )
}

export function MobileListCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  )
}
