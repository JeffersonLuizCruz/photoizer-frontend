import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface StickyActionBarProps {
  children: ReactNode
  className?: string
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        'sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:bottom-0 sm:-mx-6 sm:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
