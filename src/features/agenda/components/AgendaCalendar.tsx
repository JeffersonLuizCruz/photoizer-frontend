import { useMemo, useState } from 'react'
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
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AgendaCalendarEvent, statusColors } from './AgendaCalendarEvent'
import type { Agendamento } from '../types'

type CalendarView = 'month' | 'week' | 'day'

interface AgendaCalendarProps {
  agendamentos: Agendamento[]
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onEventClick: (id: string) => void
  onDateSelect?: (date: Date) => void
  isLoading?: boolean
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

function WeekViewHeader() {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return (
    <div className="grid grid-cols-7 mb-2">
      {days.map((day) => (
        <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
          {day}
        </div>
      ))}
    </div>
  )
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function MonthView({
  currentDate,
  selectedDate,
  eventsByDate,
  onDayClick,
  onEventClick,
}: {
  currentDate: Date
  selectedDate?: Date
  eventsByDate: Record<string, Agendamento[]>
  onDayClick: (date: Date) => void
  onEventClick: (id: string) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate[key] ?? []
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
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                    isTodayDate && 'bg-primary text-primary-foreground font-bold',
                    isSelectedDate && !isTodayDate && 'bg-primary/10 font-semibold',
                    !isCurrentMonth && 'text-muted-foreground/50',
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayEvents.slice(0, 4).map((ev) => (
                      <span
                        key={ev.id}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          statusColors[ev.status] ?? 'bg-gray-400',
                        )}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] text-muted-foreground font-medium">+{dayEvents.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <AgendaCalendarEvent
                    key={event.id}
                    agendamento={event}
                    onClick={onEventClick}
                    compact
                  />
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-0.5">
                    +{dayEvents.length - 2} mais
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AgendaCalendar({ agendamentos, view, onViewChange, onEventClick, onDateSelect, isLoading }: AgendaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const eventsByDate = useMemo(() => groupByDate(agendamentos), [agendamentos])

  const selectedDateEvents = selectedDate ? eventsByDate[format(selectedDate, 'yyyy-MM-dd')] ?? [] : []

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const navigatePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const navigateToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize">{titleText}</h2>
          <Button variant="outline" size="sm" onClick={navigateNext}>
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

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          eventsByDate={eventsByDate}
          onDayClick={handleDayClick}
          onEventClick={onEventClick}
        />
      )}

      {view === 'week' && (
        <div className="rounded-lg border bg-card p-4">
          <WeekViewHeader />
          <div className="grid grid-cols-7 gap-px bg-border">
            {eachDayOfInterval({
              start: startOfWeek(currentDate, { weekStartsOn: 0 }),
              end: endOfWeek(currentDate, { weekStartsOn: 0 }),
            }).map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDate[key] ?? []
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-28 bg-card p-1.5',
                    !isSameMonth(day, currentDate) && 'opacity-40',
                    isSelected && 'bg-accent/50',
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <div
                    className={cn(
                      'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isToday(day) && 'bg-primary text-primary-foreground font-bold',
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <AgendaCalendarEvent
                        key={event.id}
                        agendamento={event}
                        onClick={onEventClick}
                        compact
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-0.5">
                        +{dayEvents.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Eventos do dia
          </h3>
          {selectedDateEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum agendamento para este dia.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <AgendaCalendarEvent
                  key={event.id}
                  agendamento={event}
                  onClick={onEventClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {view !== 'day' && selectedDateEvents.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Agendamentos para {selectedDate ? format(selectedDate, "dd 'de' MMM", { locale: ptBR }) : ''}
          </h3>
          <div className="space-y-2">
            {selectedDateEvents.map((event) => (
              <AgendaCalendarEvent
                key={event.id}
                agendamento={event}
                onClick={onEventClick}
              />
            ))}
          </div>
        </div>
      )}

      {agendamentos.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum agendamento encontrado</p>
        </div>
      )}
    </div>
  )
}
