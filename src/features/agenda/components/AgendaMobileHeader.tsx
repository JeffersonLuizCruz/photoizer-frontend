import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight, Menu, Search, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { useAuth } from '@/features/auth/AuthProvider'

interface AgendaMobileHeaderProps {
  currentDate: Date
  onMonthChange: (date: Date) => void
  onOpenOptions: () => void
  searchValue: string
  onSearchChange: (value: string) => void
}

const MONTHS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function AgendaMobileHeader({
  currentDate,
  onMonthChange,
  onOpenOptions,
  searchValue,
  onSearchChange,
}: AgendaMobileHeaderProps) {
  const { user } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear())

  useEffect(() => {
    setPickerYear(currentDate.getFullYear())
  }, [currentDate])

  const initials =
    user?.nome
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'

  const monthLabel = capitalize(format(currentDate, 'MMMM', { locale: ptBR }))
  const today = new Date()

  const selectMonth = (monthIndex: number) => {
    onMonthChange(new Date(pickerYear, monthIndex, 1))
    setPickerOpen(false)
  }

  return (
    <div className="-mx-4 -mt-4 mb-2 border-b bg-background/95 px-2 backdrop-blur">
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenOptions}
          aria-label="Abrir opções da agenda"
          className="h-11 w-11 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 min-w-0 items-center gap-1 rounded-lg px-2 text-left text-lg font-semibold capitalize transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Mês atual: ${monthLabel} de ${currentDate.getFullYear()}. Alterar mês`}
            >
              <span className="truncate">
                {monthLabel} {currentDate.getFullYear()}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <div className="mb-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPickerYear((y) => y - 1)}
                aria-label="Ano anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{pickerYear}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPickerYear((y) => y + 1)}
                aria-label="Próximo ano"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((label, index) => {
                const isCurrent =
                  pickerYear === currentDate.getFullYear() && index === currentDate.getMonth()
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => selectMonth(index)}
                    aria-pressed={isCurrent}
                    className={cn(
                      'flex min-h-11 items-center justify-center rounded-md text-sm font-medium capitalize transition-colors',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? 'Fechar busca' : 'Buscar cliente'}
            aria-expanded={searchOpen}
          >
            <Search className="h-5 w-5" />
          </Button>

          <button
            type="button"
            onClick={() => onMonthChange(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}
            aria-label="Ir para hoje"
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-7 w-7 flex-col items-center justify-center rounded-md border text-[10px] font-semibold leading-none">
              <span className="text-[7px] uppercase text-muted-foreground">Hoje</span>
              {today.getDate()}
            </span>
          </button>

          {user && (
            <Avatar className="mx-1 h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="relative pb-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            autoFocus
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar cliente..."
            type="search"
            enterKeyHint="search"
            aria-label="Buscar cliente"
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
