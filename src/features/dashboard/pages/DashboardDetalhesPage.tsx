import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { useAgendamentosList } from '@/features/agenda/api/queries'
import { AGENDAMENTO_STATUS, ROUTES } from '@/shared/constants'
import { DashboardDetalhesPagamentos } from '../components/DashboardDetalhesPagamentos'

export function DashboardDetalhesPage() {
  const navigate = useNavigate()
  const { data: agendamentos, isLoading } = useAgendamentosList()

  const pagamentosPendentes = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos.filter((a) => a.status === AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL)
  }, [agendamentos])

  return (
    <div>
      <PageTitle
        title="Detalhes do Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Detalhes' },
        ]}
        actions={
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate(ROUTES.DASHBOARD)}
          >
            Voltar para Dashboard
          </button>
        }
      />

      <div className="mt-4">
        <DashboardDetalhesPagamentos agendamentos={pagamentosPendentes} isLoading={isLoading} />
      </div>
    </div>
  )
}
