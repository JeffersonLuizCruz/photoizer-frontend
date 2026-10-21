import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface StickyActionBarProps {
  children: ReactNode
  className?: string
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <>
      <div aria-hidden="true" className="mt-6 h-16 lg:hidden" />
      <div
        data-testid="sticky-action-bar"
        className={cn(
          'fixed inset-x-0 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom))] z-40 border-t bg-background px-4 py-3 lg:sticky lg:inset-x-auto lg:bottom-0 lg:z-20 lg:-mx-6 lg:mt-6 lg:px-6',
          className,
        )}
      >
        <div className="flex w-full min-w-0 items-center gap-2">{children}</div>
      </div>
    </>
  )
}
