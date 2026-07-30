import { useMemo } from 'react'
import { DollarSign, Camera, ArrowUpRight, ShoppingCart } from 'lucide-react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { useAgendamentosList } from '@/features/agenda/api/queries'
import { AGENDAMENTO_STATUS, ROUTES } from '@/shared/constants'
import { PagamentosPendentes } from '../components/PagamentosPendentes'
import { EntregasPendentes } from '../components/EntregasPendentes'
import { EcommerceDashboardCards } from '../components/EcommerceDashboardCards'
import { GraficoVendasExtras } from '../components/GraficoVendasExtras'
import { GraficoMensal } from '../components/GraficoMensal'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: agendamentos, isLoading: loadingAgenda } = useAgendamentosList()

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

  const isLoading = loadingAgenda

  return (
    <div>
      <PageTitle
        title="Dashboard"
        description="Visão geral das operações do dia"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="grid gap-6 md:grid-cols-2">
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
            <EntregasPendentes agendamentos={entregasPendentes} isLoading={isLoading} />
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
