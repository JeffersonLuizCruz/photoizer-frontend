import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Table2, FilterX, Search } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { DateRangePicker, type DateRange } from '@/shared/components/layout/DateRangePicker'
import { ROUTES } from '@/shared/constants'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useAgendamentosList, usePacotesList, useUsuariosList } from '../api/queries'
import { AgendaCalendar, type CalendarView } from '../components/AgendaCalendar'
import { AgendamentoList } from '../components/AgendamentoList'
import type { AgendamentoStatus } from '@/shared/constants'

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'AGUARDANDO_PAGAMENTO_FINAL', label: 'Aguardando Pagamento' },
  { value: 'EM_EDICAO', label: 'Em Edição' },
  { value: 'FOTOS_ENVIADAS_PARA_SELECAO', label: 'Fotos p/ Seleção' },
  { value: 'FOTOS_ENTREGUES', label: 'Fotos Entregues' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não Compareceu' },
]

export function AgendaPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [calendarView, setCalendarView] = useState<CalendarView>('month')

  const [statusFilter, setStatusFilter] = useState('')
  const [editorFilter, setEditorFilter] = useState('')
  const [pacoteFilter, setPacoteFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [clientSearch, setClientSearch] = useState('')

  const debouncedClientSearch = useDebounce(clientSearch, 300)

  const queryParams = useMemo(() => {
    const params: {
      status?: AgendamentoStatus
      editorId?: string
      dataInicio?: string
      dataFim?: string
      search?: string
    } = {}

    if (statusFilter) params.status = statusFilter as AgendamentoStatus
    if (editorFilter) params.editorId = editorFilter
    if (dateRange?.from) params.dataInicio = format(dateRange.from, 'yyyy-MM-dd')
    if (dateRange?.to) params.dataFim = format(dateRange.to, 'yyyy-MM-dd')
    if (debouncedClientSearch) params.search = debouncedClientSearch

    return params
  }, [statusFilter, editorFilter, dateRange, debouncedClientSearch])

  const { data: agendamentos, isLoading } = useAgendamentosList(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  )
  const { data: pacotes } = usePacotesList()
  const { data: usuarios } = useUsuariosList()

  const filteredAgendamentos = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos.filter((a) => {
      if (pacoteFilter && a.pacoteId !== pacoteFilter) return false
      return true
    })
  }, [agendamentos, pacoteFilter])

  const hasActiveFilters = statusFilter || editorFilter || pacoteFilter || dateRange?.from || clientSearch

  const clearFilters = () => {
    setStatusFilter('')
    setEditorFilter('')
    setPacoteFilter('')
    setDateRange(undefined)
    setClientSearch('')
  }

  return (
    <div>
      <PageTitle
        title="Agenda"
        description="Visualize e gerencie os ensaios agendados"
        breadcrumbs={[{ label: 'Agenda' }]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={editorFilter} onValueChange={setEditorFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por editor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os editores</SelectItem>
              {usuarios?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pacoteFilter} onValueChange={setPacoteFilter}>
            <SelectTrigger className="w-44">
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
            className="w-56"
          />

          {viewMode === 'list' && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-44 pl-8"
              />
            </div>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="mr-1 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="mr-1 h-4 w-4" />
            Calendário
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <Table2 className="mr-1 h-4 w-4" />
            Lista
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <AgendaCalendar
          agendamentos={filteredAgendamentos}
          view={calendarView}
          onViewChange={setCalendarView}
          onEventClick={(id) => navigate(ROUTES.AGENDA_DETALHES.replace(':id', id))}
          onDateSelect={(date) => {
            const params = new URLSearchParams()
            params.set('data', format(date, 'yyyy-MM-dd'))
            navigate(`${ROUTES.AGENDA_NOVO}?${params.toString()}`)
          }}
          isLoading={isLoading}
        />
      ) : (
        <AgendamentoList
          agendamentos={filteredAgendamentos}
          isLoading={isLoading}
          pacotes={pacotes}
          usuarios={usuarios}
        />
      )}
    </div>
  )
}
