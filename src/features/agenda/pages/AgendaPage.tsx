import { useState, useMemo } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, CalendarPlus, Table2, FilterX, Search, Clock, MapPin, Lock } from 'lucide-react'
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ListToolbar, FilterSheet } from '@/shared/components/mobile'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { DateRangePicker, type DateRange } from '@/shared/components/layout/DateRangePicker'
import { cn } from '@/shared/lib/cn'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useIsMobile } from '@/shared/hooks/use-media-query'
import { useAgendamentosList, usePacotesList, useUsuariosList } from '../api/queries'
import { useBloqueios } from '../api/bloqueio.queries'
import { AgendaCalendar, type CalendarView } from '../components/AgendaCalendar'
import { BloqueioAgendaDialog } from '../components/BloqueioAgendaDialog'
import { AgendamentoList } from '../components/AgendamentoList'
import { AgendaMobileHeader } from '../components/AgendaMobileHeader'
import { AgendaOptionsDrawer, type AgendaViewMode } from '../components/AgendaOptionsDrawer'
import { AgendaFab } from '../components/AgendaFab'
import { statusLabels } from '../components/AgendaCalendarEvent'
import { AGENDA_STATUS_OPTIONS } from '../constants'
import type { AgendamentoStatus } from '@/shared/constants'
import type { BloqueioAgenda } from '../types'
import { useAuth } from '@/features/auth/AuthProvider'

export function AgendaPage() {
  const { papel } = useAuth()

  if (papel === 'FOTOGRAFO') {
    return <Navigate to={ROUTES.MINHA_AGENDA} replace />
  }

  return <AgendaPageContent />
}

function AgendaPageContent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, papel } = useAuth()
  const podeAvulso = papel === 'ADMIN' || papel === 'AGENDADOR'
  const isMobile = useIsMobile()
  const statusDaUrl = searchParams.get('status')
  const statusInicial = AGENDA_STATUS_OPTIONS.some((opt) => opt.value === statusDaUrl)
    ? statusDaUrl ?? ''
    : ''
  const [viewMode, setViewMode] = useState<AgendaViewMode>(statusInicial ? 'list' : 'calendar')
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date())

  const [statusFilter, setStatusFilter] = useState(statusInicial)
  const [pacoteFilter, setPacoteFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [clientSearch, setClientSearch] = useState('')
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [bloqueioDialogOpen, setBloqueioDialogOpen] = useState(false)
  const [bloqueioEditando, setBloqueioEditando] = useState<BloqueioAgenda | null>(null)
  const [bloqueioDataInicial, setBloqueioDataInicial] = useState<Date | undefined>()

  const debouncedClientSearch = useDebounce(clientSearch, 300)

  const queryParams = useMemo(() => {
    const params: {
      status?: AgendamentoStatus
      dataInicio?: string
      dataFim?: string
      search?: string
    } = {}

    if (statusFilter) params.status = statusFilter as AgendamentoStatus
    // O backend espera LocalDateTime (ISO date-time), não data pura.
    if (dateRange?.from) params.dataInicio = format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss")
    if (dateRange?.to) params.dataFim = format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss")
    if (debouncedClientSearch) params.search = debouncedClientSearch

    return params
  }, [statusFilter, dateRange, debouncedClientSearch])

  const { data: agendamentos, isLoading } = useAgendamentosList(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  )
  const { data: pacotes } = usePacotesList()
  const { data: usuarios } = useUsuariosList()

  const periodoBloqueios = useMemo(() => {
    if (calendarView === 'month') {
      return {
        inicio: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
        fim: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
      }
    }
    if (calendarView === 'week') {
      return {
        inicio: startOfWeek(currentDate, { weekStartsOn: 0 }),
        fim: endOfWeek(currentDate, { weekStartsOn: 0 }),
      }
    }
    return { inicio: startOfDay(currentDate), fim: endOfDay(currentDate) }
  }, [calendarView, currentDate])

  const { data: bloqueios } = useBloqueios(
    format(periodoBloqueios.inicio, "yyyy-MM-dd'T'HH:mm:ss"),
    format(new Date(periodoBloqueios.fim.getTime() + 1), "yyyy-MM-dd'T'HH:mm:ss"),
  )

  const bloqueiosComNome = useMemo(() => {
    const nomes = new Map((usuarios ?? []).map((u) => [u.id, u.nome]))
    return (bloqueios ?? []).map((bloqueio) => ({
      ...bloqueio,
      profissionalNome: bloqueio.profissionalId
        ? nomes.get(bloqueio.profissionalId) ?? 'Profissional'
        : 'Toda a equipe',
    }))
  }, [bloqueios, usuarios])

  const filteredAgendamentos = useMemo(() => {
    const base = agendamentos ?? []
    return base.filter((a) => {
      // Propostas removidas/recusadas (CANCELADO) não devem poluir a agenda.
      // Ficam visíveis apenas quando o usuário filtra explicitamente por "Cancelado".
      if (a.status === AGENDAMENTO_STATUS.CANCELADO && statusFilter !== AGENDAMENTO_STATUS.CANCELADO) {
        return false
      }
      if (pacoteFilter && a.pacoteId !== pacoteFilter) return false
      return true
    })
  }, [agendamentos, pacoteFilter, statusFilter])

  const hasActiveFilters = Boolean(statusFilter || pacoteFilter || dateRange?.from || clientSearch)

  const clearFilters = () => {
    setStatusFilter('')
    setPacoteFilter('')
    setDateRange(undefined)
    setClientSearch('')
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date)
    setSelectedDate(date)
  }

  const openNewProposta = () => {
    const params = new URLSearchParams()
    params.set('data', format(selectedDate ?? new Date(), 'yyyy-MM-dd'))
    navigate(`${ROUTES.PROPOSTAS_NOVO}?${params.toString()}`)
  }

  const openNovoBloqueio = (data?: Date) => {
    setBloqueioEditando(null)
    setBloqueioDataInicial(data ?? selectedDate ?? new Date())
    setBloqueioDialogOpen(true)
  }

  const openEditarBloqueio = (bloqueio: BloqueioAgenda) => {
    setBloqueioEditando(bloqueio)
    setBloqueioDataInicial(undefined)
    setBloqueioDialogOpen(true)
  }

  const podeGerenciarBloqueio = (bloqueio: BloqueioAgenda) =>
    user?.papel === 'ADMIN' || bloqueio.criadoPorId === user?.userId

  const diaTotalmenteBloqueado = (date: Date) => {
    const inicioDia = startOfDay(date)
    const fimDia = endOfDay(date)
    return bloqueiosComNome.some((bloqueio) =>
      !bloqueio.profissionalId
      && new Date(bloqueio.inicio) <= inicioDia
      && new Date(bloqueio.fim) > fimDia,
    )
  }

  const filtrosControles = (
    <>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          {AGENDA_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={pacoteFilter} onValueChange={setPacoteFilter}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Filtrar por pacote" />
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

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        placeholder="Filtrar por período"
        className="w-full sm:w-56"
      />
    </>
  )

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-lg border p-0.5">
      <Button
        variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('calendar')}
        aria-pressed={viewMode === 'calendar'}
      >
        <CalendarDays className="mr-1 h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Calendário</span>
        <span className="sm:hidden">Mês</span>
      </Button>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        aria-pressed={viewMode === 'list'}
      >
        <Table2 className="mr-1 h-4 w-4" aria-hidden="true" />
        Lista
      </Button>
    </div>
  )

  return (
    <div>
      {!isMobile && (
        <PageTitle
          title="Agenda"
          description="Visualize e gerencie os ensaios agendados"
          breadcrumbs={[{ label: 'Agenda' }]}
        />
      )}

      {isMobile && (
        <>
          <AgendaMobileHeader
            currentDate={currentDate}
            onMonthChange={handleMonthChange}
            onOpenOptions={() => setOptionsOpen(true)}
          />
          <div className="mb-2 grid grid-cols-2 gap-2">
            {podeAvulso && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => navigate(ROUTES.AGENDA_AVULSO)}
              >
                <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Avulso
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn('w-full', !podeAvulso && 'col-span-2')}
              onClick={() => openNovoBloqueio()}
            >
              <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
              Novo compromisso
            </Button>
          </div>
        </>
      )}

      {!isMobile && (
        <>
          <ListToolbar
            searchValue={clientSearch}
            onSearchChange={setClientSearch}
            searchPlaceholder="Buscar cliente..."
            onOpenFilters={() => setFiltrosOpen(true)}
            activeFilterCount={[statusFilter, pacoteFilter, dateRange?.from].filter(Boolean).length}
            right={
              <div className="flex items-center gap-2">
                {podeAvulso && (
                  <Button size="sm" onClick={() => navigate(ROUTES.AGENDA_AVULSO)}>
                    <CalendarPlus className="mr-1 h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Agendamento avulso</span>
                    <span className="sm:hidden">Avulso</span>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openNovoBloqueio()}>
                  <Lock className="mr-1 h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Compromisso</span>
                  <span className="sm:hidden">Bloquear</span>
                </Button>
                {viewToggle}
              </div>
            }
          />

          <div className="mb-4 hidden flex-wrap items-center gap-2 md:flex">
            {filtrosControles}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <FilterX className="mr-1 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          <FilterSheet
            open={filtrosOpen}
            onOpenChange={setFiltrosOpen}
            title="Filtrar agenda"
            description="Refine os ensaios exibidos"
            onApply={() => setFiltrosOpen(false)}
            onClear={clearFilters}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Status</span>
                {filtrosControles}
              </div>
            </div>
          </FilterSheet>
        </>
      )}

      {viewMode === 'calendar' ? (
        <AgendaCalendar
          agendamentos={filteredAgendamentos}
          view={calendarView}
          onViewChange={setCalendarView}
          currentDate={currentDate}
          onCurrentDateChange={setCurrentDate}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          onEventClick={(id) => navigate(ROUTES.AGENDA_DETALHES.replace(':id', id))}
          bloqueios={bloqueiosComNome}
          onBloqueioClick={(bloqueio) => {
            if (podeGerenciarBloqueio(bloqueio)) {
              openEditarBloqueio(bloqueio)
              return
            }
            toast.info(`${bloqueio.titulo} — ${bloqueio.profissionalNome ?? 'Toda a equipe'}`)
          }}
          onDateSelect={
            isMobile
              ? undefined
              : (date) => {
                  if (diaTotalmenteBloqueado(date)) {
                    toast.error('Este dia está bloqueado por um compromisso.')
                    return
                  }
                  const params = new URLSearchParams()
                  params.set('data', format(date, 'yyyy-MM-dd'))
                  navigate(`${ROUTES.PROPOSTAS_NOVO}?${params.toString()}`)
                }
          }
          isLoading={isLoading}
          variant={isMobile ? 'mobile' : 'default'}
          showToolbar={!isMobile}
        />
      ) : (
        <AgendamentoList
          agendamentos={filteredAgendamentos}
          isLoading={isLoading}
          pacotes={pacotes}
          usuarios={usuarios}
        />
      )}

      {!isMobile && viewMode === 'calendar' && debouncedClientSearch && (
        <div className="mt-4 rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">
              Resultados da busca
              {filteredAgendamentos.length > 0 && (
                <span className="ml-1.5 font-normal text-muted-foreground">({filteredAgendamentos.length})</span>
              )}
            </h3>
          </div>
          <div className="divide-y">
            {filteredAgendamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Search className="mb-2 h-5 w-5" />
                <p className="text-sm">Nenhum cliente encontrado</p>
              </div>
            ) : (
              filteredAgendamentos.map((a) => {
                const dataHora = new Date(a.dataHoraEnsaio)
                return (
                  <div
                    key={a.id}
                    className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', a.id))}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.clienteNome}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(dataHora, 'dd/MM/yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(dataHora, 'HH:mm')}
                        </span>
                        {a.localEnsaio && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {a.localEnsaio}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusLabels[a.status]?.variant ?? 'default'}>
                      {statusLabels[a.status]?.label ?? a.status}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {isMobile && (
        <>
          <AgendaOptionsDrawer
            open={optionsOpen}
            onOpenChange={setOptionsOpen}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            calendarView={calendarView}
            onCalendarViewChange={setCalendarView}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            pacoteFilter={pacoteFilter}
            onPacoteFilterChange={setPacoteFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            pacotes={pacotes}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onGoToToday={goToToday}
          />
          <AgendaFab onClick={openNewProposta} />
        </>
      )}

      <BloqueioAgendaDialog
        open={bloqueioDialogOpen}
        onOpenChange={setBloqueioDialogOpen}
        bloqueio={bloqueioEditando}
        dataInicial={bloqueioDataInicial}
        usuarios={usuarios ?? []}
        podeGerenciar={bloqueioEditando ? podeGerenciarBloqueio(bloqueioEditando) : false}
      />
    </div>
  )
}
