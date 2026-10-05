import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TimelineItem {
  id: string
  title: ReactNode
  description?: ReactNode
  timestamp?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const dotTone: Record<NonNullable<TimelineItem['tone']>, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  destructive: 'bg-destructive/10 text-destructive',
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative space-y-4', className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                dotTone[item.tone ?? 'default'],
              )}
            >
              {item.icon}
            </span>
            {index < items.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="text-sm font-medium">{item.title}</div>
            {item.description && <div className="mt-0.5 text-sm text-muted-foreground">{item.description}</div>}
            {item.timestamp && <div className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
