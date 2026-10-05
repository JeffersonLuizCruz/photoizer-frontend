import { type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface KpiCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  trend?: number
  hint?: string
  onClick?: () => void
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  className?: string
}

const toneClasses: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  destructive: 'text-destructive',
}

export function KpiCard({ label, value, icon, trend, hint, onClick, tone = 'default', className }: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className={cn('shrink-0', toneClasses[tone])}>{icon}</span>}
      </div>
      <p className={cn('mt-1 text-xl font-bold tabular-nums leading-tight', toneClasses[tone])}>{value}</p>
      {(trend !== undefined || hint) && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          {trend !== undefined && Number.isFinite(trend) && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {Math.abs(trend).toFixed(0)}%
            </span>
          )}
          {hint && <span className="truncate text-muted-foreground">{hint}</span>}
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'min-h-[88px] rounded-xl border bg-card p-3 text-left shadow-sm transition-colors active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={cn('min-h-[88px] rounded-xl border bg-card p-3 shadow-sm', className)}>{content}</div>
  )
}

interface KpiGridProps {
  children: ReactNode
  className?: string
}

export function KpiGrid({ children, className }: KpiGridProps) {
  return <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4', className)}>{children}</div>
}
