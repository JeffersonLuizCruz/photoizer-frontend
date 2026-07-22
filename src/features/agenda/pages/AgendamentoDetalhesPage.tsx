import { useParams, useNavigate } from 'react-router-dom'
import { FileText, ClipboardList, DollarSign, ListTodo, ScrollText, Pencil } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import { useAgendamento, useTarefasList } from '../api/queries'
import { AgendamentoActions } from '../components/AgendamentoActions'
import { AgendamentoResumo } from '../components/AgendamentoResumo'
import { AgendamentoTimeline } from '../components/AgendamentoTimeline'
import { AgendamentoFinanceiro } from '../components/AgendamentoFinanceiro'
import { AgendamentoTarefas } from '../components/AgendamentoTarefas'
import { AgendamentoContrato } from '../components/AgendamentoContrato'

const statusCustomLabels: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary' }> = {
  [AGENDAMENTO_STATUS.CONFIRMADO]: { label: 'Confirmado', variant: 'info' },
  [AGENDAMENTO_STATUS.REALIZADO]: { label: 'Realizado', variant: 'success' },
  [AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL]: { label: 'Aguardando Pagamento', variant: 'warning' },
  [AGENDAMENTO_STATUS.EM_EDICAO]: { label: 'Em Edição', variant: 'warning' },
  [AGENDAMENTO_STATUS.SELECAO_DAS_FOTOS]: { label: 'Seleção de Fotos', variant: 'info' },
  [AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO]: { label: 'Fotos p/ Seleção', variant: 'info' },
  [AGENDAMENTO_STATUS.FOTOS_ENTREGUES]: { label: 'Fotos Entregues', variant: 'success' },
  [AGENDAMENTO_STATUS.FINALIZADO]: { label: 'Finalizado', variant: 'success' },
  [AGENDAMENTO_STATUS.CANCELADO]: { label: 'Cancelado', variant: 'destructive' },
  [AGENDAMENTO_STATUS.NO_SHOW]: { label: 'Não Compareceu', variant: 'destructive' },
}

export function AgendamentoDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: agendamento, isLoading, error } = useAgendamento(id ?? '')
  const { data: tarefas = [] } = useTarefasList(id)

  if (isLoading) return <PageLoading />
  if (error || !agendamento) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-muted-foreground">Agendamento não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(ROUTES.AGENDA)}>
          Voltar para Agenda
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageTitle
        title="Detalhes do Agendamento"
        breadcrumbs={[
          { label: 'Agenda', href: ROUTES.AGENDA },
          { label: 'Detalhes' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamento.id}/editar`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Button>
            <StatusBadge status={agendamento.status} customLabels={statusCustomLabels} />
            <AgendamentoActions agendamento={agendamento} />
          </div>
        }
      />

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">
            <ClipboardList className="mr-1.5 h-4 w-4" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <ListTodo className="mr-1.5 h-4 w-4" />
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger value="financeiro">
            <DollarSign className="mr-1.5 h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="tarefas">
            <ScrollText className="mr-1.5 h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="contrato">
            <FileText className="mr-1.5 h-4 w-4" />
            Contrato
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <AgendamentoResumo agendamento={agendamento} />
        </TabsContent>

        <TabsContent value="timeline">
          <AgendamentoTimeline agendamento={agendamento} tarefas={tarefas} />
        </TabsContent>

        <TabsContent value="financeiro">
          <AgendamentoFinanceiro agendamento={agendamento} />
        </TabsContent>

        <TabsContent value="tarefas">
          <AgendamentoTarefas tarefas={tarefas} />
        </TabsContent>

        <TabsContent value="contrato">
          <AgendamentoContrato agendamento={agendamento} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
