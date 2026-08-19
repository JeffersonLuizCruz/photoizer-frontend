import { useState, useMemo } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { CalendarDays, Table2, FilterX, Search, FileEdit, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { DateRangePicker, type DateRange } from '@/shared/components/layout/DateRangePicker'
import { ROUTES } from '@/shared/constants'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useAgendamentosList, usePacotesList, useUsuariosList, useBuscarRascunho, useDeletarRascunho } from '../api/queries'
import { AgendaCalendar, type CalendarView } from '../components/AgendaCalendar'
import { AgendamentoList } from '../components/AgendamentoList'
import { statusLabels } from '../components/AgendaCalendarEvent'
import type { AgendamentoStatus } from '@/shared/constants'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Agendamento } from '../types'
import { useWizardStore } from '../stores/wizard.store'

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
  const { papel } = useAuth()

  if (papel === 'FOTOGRAFO') {
    return <Navigate to={ROUTES.MINHA_AGENDA} replace />
  }

  return <AgendaPageContent />
}

function AgendaPageContent() {
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
  const { data: draft, isLoading: isLoadingDraft } = useBuscarRascunho()
  const { mutate: deletarRascunho } = useDeletarRascunho()

  const filteredAgendamentos = useMemo(() => {
    const base = agendamentos ?? []

    const filtered = base.filter((a) => {
      if (pacoteFilter && a.pacoteId !== pacoteFilter) return false
      return true
    })

    // Inject draft as a synthetic event in the calendar if it has a date
    if (draft && draft.data && viewMode === 'calendar') {
      const hora = draft.hora || '12:00'
      const dataHoraEnsaio = `${draft.data}T${hora}:00`

      filtered.push({
        id: (draft as any).id || 'rascunho',
        status: 'RASCUNHO',
        clienteId: draft.clienteId || '',
        clienteNome: draft.nome || 'Rascunho',
        clienteTelefone: draft.telefone || '',
        clienteEmail: draft.email || null,
        clienteCpf: draft.cpf || null,
        clienteCidade: draft.cidade || null,
        clienteEstado: draft.estado || null,
        pacoteId: draft.pacoteId || '',
        pacoteNome: '',
        editorId: draft.editorId || null,
        editorNome: null,
        dataHoraEnsaio,
        duracaoMinutos: 60,
        localEnsaio: draft.localEnsaio || '',
        enderecoCompleto: draft.enderecoCompleto || null,
        valorTotal: 0,
        valorEntradaExigido: 0,
        valorEntradaPago: 0,
        valorRestante: 0,
        valorExtras: 0,
        taxaDeslocamento: 0,
        custoDeslocamento: draft.custoDeslocamento || 0,
        repassarDeslocamento: draft.repassarDeslocamento || false,
        valorTotalFinal: 0,
        percentualEntrada: 0,
        saldoDevedor: 0,
        dataConfirmacao: null,
        dataRealizacao: null,
        dataEnvioSelecao: null,
        dataEntregaFinal: null,
        dataFinalizacao: null,
        urlComprovanteEntrada: null,
        urlComprovanteFinal: null,
        autorizaUsoImagem: draft.autorizaUsoImagem || false,
        clausulasPersonalizadas: null,
        contratoGerado: false,
        ensaioDestaque: false,
        valorComissao: null,
        indicadorNome: draft.indicadorNome || null,
        statusComissao: null,
        observacoes: draft.observacoes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Agendamento)
    }

    return filtered
  }, [agendamentos, pacoteFilter, draft, viewMode])

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
            <SelectTrigger className="w-full sm:w-44">
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
            <SelectTrigger className="w-full sm:w-44">
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

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full pl-8 sm:w-44"
            />
          </div>

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

      {draft && draft.data && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <FileEdit className="h-5 w-5 shrink-0 text-slate-400" />
            <span className="text-sm">
              <strong>Rascunho:</strong> {draft.nome || 'Novo agendamento'} — {draft.data}{draft.hora ? ` às ${draft.hora}` : ''}
            </span>
            <Badge variant="secondary">Rascunho</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.AGENDA_NOVO)}
            >
              Continuar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => deletarRascunho(undefined, { onSuccess: () => useWizardStore.getState().reset() })}
            >
              Descartar
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <AgendaCalendar
          agendamentos={filteredAgendamentos}
          view={calendarView}
          onViewChange={setCalendarView}
          onEventClick={(id) => {
            if ((draft as any)?.id === id) {
              navigate(ROUTES.AGENDA_NOVO)
            } else {
              navigate(ROUTES.AGENDA_DETALHES.replace(':id', id))
            }
          }}
          onDateSelect={(date) => {
            const params = new URLSearchParams()
            params.set('data', format(date, 'yyyy-MM-dd'))
            navigate(`${ROUTES.AGENDA_NOVO}?${params.toString()}`)
          }}
          isLoading={isLoading || isLoadingDraft}
        />
      ) : (
        <AgendamentoList
          agendamentos={filteredAgendamentos}
          isLoading={isLoading}
          pacotes={pacotes}
          usuarios={usuarios}
        />
      )}

      {viewMode === 'calendar' && debouncedClientSearch && (
        <div className="mt-4 rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">
              Resultados da busca
              {filteredAgendamentos.length > 0 && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  ({filteredAgendamentos.length})
                </span>
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
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', a.id === 'rascunho' ? '' : a.id))}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.clienteNome}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(dataHora, "dd/MM/yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(dataHora, "HH:mm")}
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
    </div>
  )
}
