import { useMemo } from 'react'
import { DollarSign, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { useAgendamentosList, useTarefasList } from '@/features/agenda/api/queries'
import { AGENDAMENTO_STATUS, ROUTES } from '@/shared/constants'
import { DashboardDetalhesPagamentos } from '../components/DashboardDetalhesPagamentos'
import { DashboardDetalhesAlertas } from '../components/DashboardDetalhesAlertas'

export function DashboardDetalhesPage() {
  const navigate = useNavigate()
  const { data: agendamentos, isLoading } = useAgendamentosList()
  const { data: tarefas, isLoading: loadingTarefas } = useTarefasList()

  const pagamentosPendentes = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos.filter((a) => a.status === AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL)
  }, [agendamentos])

  const tarefasAtrasadas = useMemo(() => {
    if (!tarefas) return []
    return tarefas.filter((t) => {
      if (t.status === 'ATRASADA') return true
      if (t.status === 'PENDENTE' && t.dataLimite && new Date(t.dataLimite) < new Date()) return true
      return false
    })
  }, [tarefas])

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

      <Tabs defaultValue="pagamentos">
        <TabsList>
          <TabsTrigger value="pagamentos">
            <DollarSign className="mr-1.5 h-4 w-4" />
            Pagamentos Pendentes
          </TabsTrigger>
          <TabsTrigger value="alertas">
            <Bell className="mr-1.5 h-4 w-4" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos" className="mt-4">
          <DashboardDetalhesPagamentos agendamentos={pagamentosPendentes} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="alertas" className="mt-4">
          <DashboardDetalhesAlertas
            tarefasAtrasadas={tarefasAtrasadas}
            agendamentos={agendamentos ?? []}
            isLoading={isLoading || loadingTarefas}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
