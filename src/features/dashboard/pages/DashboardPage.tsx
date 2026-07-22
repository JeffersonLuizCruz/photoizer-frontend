import { useMemo } from 'react'
import { format, startOfDay, endOfDay, addDays } from 'date-fns'
import { CalendarDays, DollarSign, Camera, Bell, ArrowUpRight, ShoppingCart } from 'lucide-react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { useAgendamentosList, useTarefasList } from '@/features/agenda/api/queries'
import { AGENDAMENTO_STATUS, ROUTES } from '@/shared/constants'
import { AgendaDoDia } from '../components/AgendaDoDia'
import { PagamentosPendentes } from '../components/PagamentosPendentes'
import { EntregasPendentes } from '../components/EntregasPendentes'
import { Alertas } from '../components/Alertas'
import { EcommerceDashboardCards } from '../components/EcommerceDashboardCards'
import { GraficoVendasExtras } from '../components/GraficoVendasExtras'
import { GraficoMensal } from '../components/GraficoMensal'
import { useNavigate } from 'react-router-dom'

function hoje() {
  const now = new Date()
  return {
    inicio: format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    fim: format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
  }
}

function amanha() {
  const next = addDays(new Date(), 1)
  return {
    inicio: format(startOfDay(next), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    fim: format(endOfDay(next), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: agendamentos, isLoading: loadingAgenda } = useAgendamentosList()
  const { data: tarefas, isLoading: loadingTarefas } = useTarefasList()

  const hojeDate = hoje()
  const amanhaDate = amanha()

  const agendaHoje = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos.filter((a) => {
      const d = new Date(a.dataHoraEnsaio)
      return d >= new Date(hojeDate.inicio) && d <= new Date(hojeDate.fim)
    }).sort((a, b) => new Date(a.dataHoraEnsaio).getTime() - new Date(b.dataHoraEnsaio).getTime())
  }, [agendamentos, hojeDate])

  const pagamentosPendentes = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos.filter((a) => a.status === AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL)
  }, [agendamentos])

  const entregasPendentes = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos.filter(
      (a) => a.status === AGENDAMENTO_STATUS.EM_EDICAO || a.status === AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO,
    )
  }, [agendamentos])

  const tarefasAtrasadas = useMemo(() => {
    if (!tarefas) return []
    return tarefas.filter((t) => {
      if (t.status === 'ATRASADA') return true
      if (t.status === 'PENDENTE' && t.dataLimite && new Date(t.dataLimite) < new Date()) return true
      return false
    })
  }, [tarefas])

  const ensaiosAmanha = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos.filter((a) => {
      const d = new Date(a.dataHoraEnsaio)
      return d >= new Date(amanhaDate.inicio) && d <= new Date(amanhaDate.fim)
    })
  }, [agendamentos, amanhaDate])

  const isLoading = loadingAgenda || loadingTarefas

  const hasAlertas = tarefasAtrasadas.length > 0 || ensaiosAmanha.length > 0

  return (
    <div>
      <PageTitle
        title="Dashboard"
        description="Visão geral das operações do dia"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {hasAlertas && (
        <div className="mb-6">
          <Alertas tarefasAtrasadas={tarefasAtrasadas} ensaiosAmanha={ensaiosAmanha} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Agenda do Dia</h2>
          </div>
          <div className="p-4">
            <AgendaDoDia agendamentos={agendaHoje} isLoading={isLoading} />
          </div>
        </div>

        <div
          className="rounded-lg border bg-card cursor-pointer transition-colors hover:border-primary/50"
          onClick={() => navigate(ROUTES.DASHBOARD_DETALHES)}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Pagamentos Pendentes</h2>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-4" onClick={(e) => e.stopPropagation()}>
            <PagamentosPendentes agendamentos={pagamentosPendentes} isLoading={isLoading} />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Entregas Pendentes</h2>
          </div>
          <div className="p-4">
            <EntregasPendentes agendamentos={entregasPendentes} tarefas={tarefas} isLoading={isLoading} />
          </div>
        </div>

        <div
          className="rounded-lg border bg-card cursor-pointer transition-colors hover:border-primary/50"
          onClick={() => navigate(ROUTES.DASHBOARD_DETALHES)}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Alertas</h2>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-4" onClick={(e) => e.stopPropagation()}>
            {tarefasAtrasadas.length === 0 && ensaiosAmanha.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="mb-2 h-6 w-6" />
                <p className="text-sm">Nenhum alerta no momento</p>
              </div>
            ) : (
              <Alertas tarefasAtrasadas={tarefasAtrasadas} ensaiosAmanha={ensaiosAmanha} />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Ecommerce</h2>
          </div>
          <EcommerceDashboardCards />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <GraficoMensal />
          <GraficoVendasExtras />
        </div>
      </div>
    </div>
  )
}
