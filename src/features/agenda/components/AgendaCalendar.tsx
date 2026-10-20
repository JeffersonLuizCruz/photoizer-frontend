import { useMemo, useRef, type TouchEvent as ReactTouchEvent, type MouseEvent as ReactMouseEvent } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { AgendaCalendarEvent } from './AgendaCalendarEvent'
import { BloqueioAgendaEvent } from './BloqueioAgendaEvent'
import type { Agendamento, BloqueioAgenda } from '../types'

type CalendarView = 'month' | 'week' | 'day'

interface AgendaCalendarProps {
  agendamentos: Agendamento[]
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  currentDate: Date
  onCurrentDateChange: (date: Date) => void
  selectedDate: Date | undefined
  onSelectedDateChange: (date: Date | undefined) => void
  onEventClick: (id: string) => void
  bloqueios?: BloqueioAgenda[]
  onBloqueioClick?: (bloqueio: BloqueioAgenda) => void
  onDateSelect?: (date: Date) => void
  isLoading?: boolean
  variant?: 'default' | 'mobile'
  showToolbar?: boolean
}

export { type CalendarView }

function groupByDate(agendamentos: Agendamento[]): Record<string, Agendamento[]> {
  const groups: Record<string, Agendamento[]> = {}
  for (const a of agendamentos) {
    const key = format(new Date(a.dataHoraEnsaio), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return groups
}

function groupBloqueiosByDate(bloqueios: BloqueioAgenda[]): Record<string, BloqueioAgenda[]> {
  const groups: Record<string, BloqueioAgenda[]> = {}
  for (const bloqueio of bloqueios) {
    const inicio = new Date(bloqueio.inicio)
    const fim = new Date(bloqueio.fim)
    let cursor = startOfDay(inicio)
    const ultimoDia = startOfDay(new Date(fim.getTime() - 1))
    while (cursor <= ultimoDia) {
      const key = format(cursor, 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = []
      groups[key].push(bloqueio)
      cursor = addDays(cursor, 1)
    }
  }
  return groups
}

function MoreEventsPopover({ events, onEventClick }: { events: Agendamento[]; onEventClick: (id: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full pt-0.5 text-center text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          +{events.length} mais
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-56 max-w-[calc(100vw-2rem)] space-y-1 p-2">
        {events.map((event) => (
          <AgendaCalendarEvent key={event.id} agendamento={event} onClick={onEventClick} compact />
        ))}
      </PopoverContent>
    </Popover>
  )
}

function WeekViewHeader() {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return (
    <div className="mb-2 grid grid-cols-7">
      {days.map((day) => (
        <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
          {day}
        </div>
      ))}
    </div>
  )
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MOBILE_MAX_EVENTS = 3

function MonthView({
  currentDate,
  selectedDate,
  eventsByDate,
  bloqueiosByDate,
  onDayClick,
  onEventClick,
  onBloqueioClick,
}: {
  currentDate: Date
  selectedDate?: Date
  eventsByDate: Record<string, Agendamento[]>
  bloqueiosByDate: Record<string, BloqueioAgenda[]>
  onDayClick: (date: Date) => void
  onEventClick: (id: string) => void
  onBloqueioClick?: (bloqueio: BloqueioAgenda) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="sm:min-w-[560px]">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[key] ?? []
            const dayBloqueios = bloqueiosByDate[key] ?? []
            const isSelectedDate = selectedDate && isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)

            return (
              <div
                key={key}
                className={cn(
                  'min-h-28 border-b border-r p-1.5 transition-colors',
                  !isCurrentMonth && 'bg-muted/20',
                  isSelectedDate && 'bg-accent/60 ring-1 ring-inset ring-primary/20',
                  isCurrentMonth && 'cursor-pointer hover:bg-accent/40',
                )}
                onClick={() => onDayClick(day)}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                      isTodayDate && 'bg-primary font-bold text-primary-foreground',
                      isSelectedDate && !isTodayDate && 'bg-primary/10 font-semibold',
                      !isCurrentMonth && 'text-muted-foreground/50',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayBloqueios.slice(0, 2).map((bloqueio) => (
                    <BloqueioAgendaEvent key={bloqueio.id} bloqueio={bloqueio} onClick={onBloqueioClick} compact />
                  ))}
                  {dayEvents.slice(0, dayBloqueios.length > 0 ? 2 : 4).map((event) => (
                    <AgendaCalendarEvent key={event.id} agendamento={event} onClick={onEventClick} compact />
                  ))}
                  {dayEvents.length > (dayBloqueios.length > 0 ? 2 : 4) && (
                    <MoreEventsPopover
                      events={dayEvents.slice(dayBloqueios.length > 0 ? 2 : 4)}
                      onEventClick={onEventClick}
                    />
                  )}
                  {dayBloqueios.length > 2 && (
                    <p className="pt-0.5 text-center text-[10px] text-muted-foreground">
                      +{dayBloqueios.length - 2} compromisso(s)
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Visão de mês enxuta para o mobile, inspirada no Google Calendar: grid sem
 * scroll horizontal, pills full-width e navegação por gesto horizontal.
 */
function MonthViewMobile({
  currentDate,
  selectedDate,
  eventsByDate,
  bloqueiosByDate,
  onDayClick,
  onEventClick,
  onBloqueioClick,
  onNavigate,
}: {
  currentDate: Date
  selectedDate?: Date
  eventsByDate: Record<string, Agendamento[]>
  bloqueiosByDate: Record<string, BloqueioAgenda[]>
  onDayClick: (date: Date) => void
  onEventClick: (id: string) => void
  onBloqueioClick?: (bloqueio: BloqueioAgenda) => void
  onNavigate: (direction: -1 | 1) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const handleTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    swiped.current = false
  }

  const handleTouchEnd = (e: ReactTouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true
      onNavigate(dx < 0 ? 1 : -1)
    }
    touchStart.current = null
  }

  const handleClickCapture = (e: ReactMouseEvent) => {
    if (swiped.current) {
      e.preventDefault()
      e.stopPropagation()
      swiped.current = false
    }
  }

  return (
    <div className="-mx-4 border-y" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClickCapture={handleClickCapture}>
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_INITIALS.map((letter, index) => (
          <div
            key={`${letter}-${index}`}
            className="py-1.5 text-center text-[11px] font-medium text-muted-foreground"
            aria-hidden="true"
          >
            {letter}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate[key] ?? []
          const dayBloqueios = bloqueiosByDate[key] ?? []
          const isSelectedDate = selectedDate && isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={key}
              className={cn(
                'min-h-24 border-b border-r p-0.5',
                !isCurrentMonth && 'bg-muted/20',
                isSelectedDate && 'bg-accent/50',
              )}
            >
              <div className="flex justify-start px-0.5 pb-0.5 pt-1">
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  aria-label={`Selecionar ${format(day, 'dd/MM/yyyy')}`}
                  aria-current={isTodayDate ? 'date' : undefined}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isTodayDate && 'bg-primary font-bold text-primary-foreground',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    isSelectedDate && !isTodayDate && 'bg-primary/10 font-semibold',
                  )}
                >
                  {format(day, 'd')}
                </button>
              </div>
              <div className="space-y-0.5">
                {dayBloqueios.slice(0, 1).map((bloqueio) => (
                  <BloqueioAgendaEvent key={bloqueio.id} bloqueio={bloqueio} onClick={onBloqueioClick} pill />
                ))}
                {dayEvents.slice(0, dayBloqueios.length > 0 ? MOBILE_MAX_EVENTS - 1 : MOBILE_MAX_EVENTS).map((event) => (
                  <AgendaCalendarEvent key={event.id} agendamento={event} onClick={onEventClick} pill />
                ))}
                {dayEvents.length > (dayBloqueios.length > 0 ? MOBILE_MAX_EVENTS - 1 : MOBILE_MAX_EVENTS) && (
                  <MoreEventsPopover
                    events={dayEvents.slice(dayBloqueios.length > 0 ? MOBILE_MAX_EVENTS - 1 : MOBILE_MAX_EVENTS)}
                    onEventClick={onEventClick}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AgendaCalendar({
  agendamentos,
  view,
  onViewChange,
  currentDate,
  onCurrentDateChange,
  selectedDate,
  onSelectedDateChange,
  onEventClick,
  bloqueios = [],
  onBloqueioClick,
  onDateSelect,
  isLoading,
  variant = 'default',
  showToolbar = true,
}: AgendaCalendarProps) {
  const eventsByDate = useMemo(() => groupByDate(agendamentos), [agendamentos])
  const bloqueiosByDate = useMemo(() => groupBloqueiosByDate(bloqueios), [bloqueios])

  const selectedDateEvents = selectedDate ? eventsByDate[format(selectedDate, 'yyyy-MM-dd')] ?? [] : []
  const selectedDateBloqueios = selectedDate ? bloqueiosByDate[format(selectedDate, 'yyyy-MM-dd')] ?? [] : []

  const handleDayClick = (date: Date) => {
    onSelectedDateChange(date)
    onDateSelect?.(date)
  }

  const navigateBy = (direction: -1 | 1) => {
    if (view === 'month') onCurrentDateChange(direction === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    else if (view === 'week') onCurrentDateChange(direction === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    else onCurrentDateChange(direction === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1))
  }

  const navigateToday = () => {
    const today = new Date()
    onCurrentDateChange(today)
    onSelectedDateChange(today)
  }

  const titleText = (() => {
    if (view === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "dd 'de' MMM", { locale: ptBR })}`
    }
    return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  })()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateBy(-1)} aria-label="Período anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold capitalize sm:text-lg">{titleText}</h2>
            <Button variant="outline" size="sm" onClick={() => navigateBy(1)} aria-label="Próximo período">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={navigateToday}>
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            {(['month', 'week', 'day'] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewChange(v)}
                className="capitalize"
              >
                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {view === 'month' &&
        (variant === 'mobile' ? (
          <MonthViewMobile
            currentDate={currentDate}
            selectedDate={selectedDate}
            eventsByDate={eventsByDate}
            bloqueiosByDate={bloqueiosByDate}
            onDayClick={handleDayClick}
            onEventClick={onEventClick}
            onBloqueioClick={onBloqueioClick}
            onNavigate={navigateBy}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            eventsByDate={eventsByDate}
            bloqueiosByDate={bloqueiosByDate}
            onDayClick={handleDayClick}
            onEventClick={onEventClick}
            onBloqueioClick={onBloqueioClick}
          />
        ))}

      {view === 'week' && (
        <div className="overflow-x-auto rounded-lg border bg-card p-4">
          <div className="sm:min-w-[560px]">
            <WeekViewHeader />
            <div className="grid grid-cols-7 gap-px bg-border">
              {eachDayOfInterval({
                start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                end: endOfWeek(currentDate, { weekStartsOn: 0 }),
              }).map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDate[key] ?? []
                const dayBloqueios = bloqueiosByDate[key] ?? []
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-28 bg-card p-1.5',
                      !isSameMonth(day, currentDate) && 'opacity-40',
                      isSelected && 'bg-accent/50',
                    )}
                    onClick={() => onSelectedDateChange(day)}
                  >
                    <div
                      className={cn(
                        'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs',
                        isToday(day) && 'bg-primary font-bold text-primary-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayBloqueios.slice(0, 2).map((bloqueio) => (
                        <BloqueioAgendaEvent key={bloqueio.id} bloqueio={bloqueio} onClick={onBloqueioClick} compact />
                      ))}
                      {dayEvents.slice(0, dayBloqueios.length > 0 ? 2 : 4).map((event) => (
                        <AgendaCalendarEvent key={event.id} agendamento={event} onClick={onEventClick} compact />
                      ))}
                      {dayEvents.length > (dayBloqueios.length > 0 ? 2 : 4) && (
                        <MoreEventsPopover
                          events={dayEvents.slice(dayBloqueios.length > 0 ? 2 : 4)}
                          onEventClick={onEventClick}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Eventos do dia</h3>
          {selectedDateEvents.length === 0 && selectedDateBloqueios.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento para este dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateBloqueios.map((bloqueio) => (
                <BloqueioAgendaEvent key={bloqueio.id} bloqueio={bloqueio} onClick={onBloqueioClick} />
              ))}
              {selectedDateEvents.map((event) => (
                <AgendaCalendarEvent key={event.id} agendamento={event} onClick={onEventClick} />
              ))}
            </div>
          )}
        </div>
      )}

      {agendamentos.length === 0 && bloqueios.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum agendamento encontrado</p>
        </div>
      )}
    </div>
  )
}
