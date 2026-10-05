import { useEffect, useRef, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/components/layout/EmptyState'
import { MobileListCardSkeleton } from './mobile-list-card'

interface ResponsiveListProps<T> {
  items: T[]
  keyExtractor: (item: T) => string
  renderCard: (item: T) => ReactNode
  renderDesktop?: () => ReactNode
  isLoading?: boolean
  skeletonCount?: number
  emptyMessage?: string
  emptyDescription?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  className?: string
}

export function ResponsiveList<T>({
  items,
  keyExtractor,
  renderCard,
  renderDesktop,
  isLoading,
  skeletonCount = 4,
  emptyMessage = 'Nenhum registro encontrado',
  emptyDescription,
  onLoadMore,
  hasMore,
  isLoadingMore,
  className,
}: ResponsiveListProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!onLoadMore || !hasMore) return
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore])

  if (isLoading) {
    return (
      <div className={cn('space-y-3 md:hidden', className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MobileListCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />
  }

  return (
    <div className={className}>
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div key={keyExtractor(item)}>{renderCard(item)}</div>
        ))}
      </div>

      {renderDesktop && <div className="hidden md:block">{renderDesktop()}</div>}

      {onLoadMore && hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4 md:hidden" aria-hidden={!isLoadingMore}>
          {isLoadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
