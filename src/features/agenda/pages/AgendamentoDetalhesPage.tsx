import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, ClipboardList, DollarSign, ListTodo, Pencil, Camera, ShoppingBag } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { PageLoading } from '@/shared/components/layout/Loading'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { DetailHeader, StickyActionBar } from '@/shared/components/mobile'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAgendamento, useReatribuicoes } from '../api/queries'
import { AgendamentoActions } from '../components/AgendamentoActions'
import { AgendamentoResumo } from '../components/AgendamentoResumo'
import { AgendamentoTimeline } from '../components/AgendamentoTimeline'
import { AgendamentoFinanceiro } from '../components/AgendamentoFinanceiro'
import { AgendamentoContrato } from '../components/AgendamentoContrato'
import { EcommerceAdminResumo } from '@/features/ecommerce/components/EcommerceAdminResumo'

const statusCustomLabels: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary' }> = {
  [AGENDAMENTO_STATUS.PRE_RESERVA]: { label: 'Pré-reserva', variant: 'secondary' },
  [AGENDAMENTO_STATUS.AGUARDANDO_APROVACAO]: { label: 'Aguardando Aprovação', variant: 'warning' },
  [AGENDAMENTO_STATUS.PAGAMENTO_CONFIRMADO]: { label: 'Pagamento Confirmado', variant: 'info' },
  [AGENDAMENTO_STATUS.CONFIRMADO]: { label: 'Confirmado', variant: 'info' },
  [AGENDAMENTO_STATUS.REALIZADO]: { label: 'Realizado', variant: 'success' },
  [AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL]: { label: 'Aguardando Pagamento', variant: 'warning' },
  [AGENDAMENTO_STATUS.EM_EDICAO]: { label: 'Em Edição', variant: 'warning' },
  [AGENDAMENTO_STATUS.FINALIZADO]: { label: 'Finalizado', variant: 'success' },
  [AGENDAMENTO_STATUS.CANCELADO]: { label: 'Cancelado', variant: 'destructive' },
  [AGENDAMENTO_STATUS.NO_SHOW]: { label: 'Não Compareceu', variant: 'destructive' },
}

export function AgendamentoDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: agendamento, isLoading, error } = useAgendamento(id ?? '')
  const { data: reatribuicoes = [] } = useReatribuicoes(id ?? '')
  const { user } = useAuth()
  const podeEditar = user?.papel === 'ADMIN' || user?.papel === 'EDITOR'
  const isAdmin = user?.papel === 'ADMIN'

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

  const iniciais =
    agendamento.clienteNome
      ?.split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'

  const subtitulo = [
    agendamento.pacoteNome,
    agendamento.dataHoraEnsaio
      ? format(new Date(agendamento.dataHoraEnsaio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      : null,
  ]
    .filter(Boolean)
    .join(' • ')

  return (
    <div>
      <DetailHeader
        backTo={ROUTES.AGENDA}
        initials={iniciais}
        title={agendamento.clienteNome ?? 'Detalhes do Agendamento'}
        subtitle={subtitulo}
        status={<StatusBadge status={agendamento.status} customLabels={statusCustomLabels} />}
        contato={{
          telefone: agendamento.clienteTelefone,
          email: agendamento.clienteEmail,
          whatsappMessage: `Olá ${agendamento.clienteNome ?? ''}, sobre o seu ensaio (${agendamento.pacoteNome}):`,
        }}
        actions={
          <>
            {podeEditar && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Editar agendamento"
                onClick={() => navigate(`/agenda/${agendamento.id}/editar`)}
              >
                <Pencil className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}
            {podeEditar && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Abrir fotos do ensaio"
                onClick={() => navigate(`/agenda/${agendamento.id}/fotos`)}
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}
          </>
        }
      />

      <div className="mt-5">
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
            {isAdmin && (
              <TabsTrigger value="financeiro">
                <DollarSign className="mr-1.5 h-4 w-4" />
                Financeiro
              </TabsTrigger>
            )}
            <TabsTrigger value="contrato">
              <FileText className="mr-1.5 h-4 w-4" />
              Contrato
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="ecommerce">
                <ShoppingBag className="mr-1.5 h-4 w-4" />
                Ecommerce
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="resumo">
            <AgendamentoResumo agendamento={agendamento} />
          </TabsContent>

          <TabsContent value="timeline">
            <AgendamentoTimeline agendamento={agendamento} reatribuicoes={reatribuicoes} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="financeiro">
              <AgendamentoFinanceiro agendamento={agendamento} />
            </TabsContent>
          )}

          <TabsContent value="contrato">
            <AgendamentoContrato agendamento={agendamento} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="ecommerce">
              <EcommerceAdminResumo agendamentoId={agendamento.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <StickyActionBar>
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1">
          <AgendamentoActions agendamento={agendamento} />
        </div>
      </StickyActionBar>
    </div>
  )
}
