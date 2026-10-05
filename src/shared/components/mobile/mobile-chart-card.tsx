import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { useIsMobile } from '@/shared/hooks/use-media-query'

interface MobileChartCardProps {
  title: ReactNode
  action?: ReactNode
  children: (isMobile: boolean) => ReactNode
  className?: string
}

export function MobileChartCard({ title, action, children, className }: MobileChartCardProps) {
  const isMobile = useIsMobile()

  return (
    <div className={cn('rounded-xl border bg-card p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children(isMobile)}
    </div>
  )
}
