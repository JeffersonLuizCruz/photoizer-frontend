import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'

export interface SearchableOption {
  value: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  emptyText?: string
  isLoading?: boolean
  onSearchChange?: (search: string) => void
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled,
  className,
  emptyText = 'Nenhuma opção encontrada',
  isLoading,
  onSearchChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(term) ||
        (o.sublabel ?? '').toLowerCase().includes(term),
    )
  }, [options, search])

  const handleSelect = (option: SearchableOption) => {
    onChange(option.value)
    setOpen(false)
    setSearch('')
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setSearch('') }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', className)}
        >
          {selected ? (
            <span className="truncate">{selected.label}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          {value ? (
            <X className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100" onClick={clear} />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[280px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              onSearchChange?.(e.target.value)
            }}
            placeholder="Buscar..."
            className="pl-8"
          />
        </div>
        <div className="max-h-56 overflow-auto">
          {isLoading && <p className="p-3 text-center text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="p-3 text-center text-sm text-muted-foreground">{emptyText}</p>
          )}
          {!isLoading &&
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{option.label}</p>
                  {option.sublabel && (
                    <p className="truncate text-xs text-muted-foreground">{option.sublabel}</p>
                  )}
                </div>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
