import { type ReactNode } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'

interface ListToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onOpenFilters?: () => void
  activeFilterCount?: number
  right?: ReactNode
  className?: string
}

export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  onOpenFilters,
  activeFilterCount = 0,
  right,
  className,
}: ListToolbarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 -mx-4 -mt-4 flex items-center gap-2 border-b bg-background/95 px-4 pb-2 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pb-3 sm:pt-6',
        className,
      )}
    >
      {onSearchChange && (
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            enterKeyHint="search"
            aria-label={searchPlaceholder}
            className="pl-9 pr-9"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      )}

      {right}

      {onOpenFilters && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenFilters}
          aria-label={activeFilterCount > 0 ? `Filtros avançados, ${activeFilterCount} ativo(s)` : 'Filtros avançados'}
          className="relative shrink-0"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      )}
    </div>
  )
}
