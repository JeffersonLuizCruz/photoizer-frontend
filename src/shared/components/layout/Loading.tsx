import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

export function Spinner({ size = 24, className, label }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className="animate-spin text-muted-foreground" style={{ width: size, height: size }} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  )
}

interface PageLoadingProps {
  label?: string
}

export function PageLoading({ label = 'Carregando...' }: PageLoadingProps) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <Spinner label={label} />
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-64" />
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex gap-4 p-3">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 border-b p-3 last:border-0">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CardSkeletonProps {
  count?: number
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}
