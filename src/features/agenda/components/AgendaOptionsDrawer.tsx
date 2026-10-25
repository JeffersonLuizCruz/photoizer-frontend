import * as DialogPrimitive from '@radix-ui/react-dialog'
import { CalendarDays, List, RotateCcw, Sun, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { DateRangePicker, type DateRange } from '@/shared/components/layout/DateRangePicker'
import { AGENDA_STATUS_OPTIONS } from '../constants'
import type { CalendarView } from './AgendaCalendar'
import type { Pacote } from '../types'

export type AgendaViewMode = 'calendar' | 'list'

interface AgendaOptionsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewMode: AgendaViewMode
  onViewModeChange: (mode: AgendaViewMode) => void
  calendarView: CalendarView
  onCalendarViewChange: (view: CalendarView) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  pacoteFilter: string
  onPacoteFilterChange: (value: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  pacotes?: Pacote[]
  hasActiveFilters: boolean
  onClearFilters: () => void
  onGoToToday: () => void
}

const CALENDAR_VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
]

export function AgendaOptionsDrawer({
  open,
  onOpenChange,
  viewMode,
  onViewModeChange,
  calendarView,
  onCalendarViewChange,
  statusFilter,
  onStatusFilterChange,
  pacoteFilter,
  onPacoteFilterChange,
  dateRange,
  onDateRangeChange,
  pacotes,
  hasActiveFilters,
  onClearFilters,
  onGoToToday,
}: AgendaOptionsDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition-opacity" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col bg-background shadow-xl',
            'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
            'data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 transition-transform duration-300 ease-in-out focus:outline-none',
          )}
          aria-label="Opções da agenda"
        >
          <DialogPrimitive.Title className="sr-only">Opções da agenda</DialogPrimitive.Title>

          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-base font-semibold">Agenda</span>
            <DialogPrimitive.Close
              aria-label="Fechar opções"
              className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exibir</h2>
              <div className="grid grid-cols-2 gap-2">
                <OptionButton
                  active={viewMode === 'calendar'}
                  icon={CalendarDays}
                  label="Calendário"
                  onClick={() => onViewModeChange('calendar')}
                />
                <OptionButton
                  active={viewMode === 'list'}
                  icon={List}
                  label="Lista"
                  onClick={() => onViewModeChange('list')}
                />
              </div>
            </section>

            {viewMode === 'calendar' && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visualização</h2>
                <div className="grid grid-cols-3 gap-2">
                  {CALENDAR_VIEWS.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => onCalendarViewChange(v.value)}
                      aria-pressed={calendarView === v.value}
                      className={cn(
                        'flex min-h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                        calendarView === v.value
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filtros</h2>

              <div className="space-y-1.5">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENDA_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm text-muted-foreground">Pacote</span>
                <Select value={pacoteFilter} onValueChange={onPacoteFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os pacotes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os pacotes</SelectItem>
                    {pacotes?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm text-muted-foreground">Período</span>
                <DateRangePicker value={dateRange} onChange={onDateRangeChange} placeholder="Filtrar por período" />
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-2 border-t px-4 py-3">
            <Button type="button" variant="outline" onClick={onGoToToday} className="w-full justify-start">
              <Sun className="mr-2 h-4 w-4" />
              Ir para hoje
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={onClearFilters}
                className="w-full justify-start text-muted-foreground"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function OptionButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
        active
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}
