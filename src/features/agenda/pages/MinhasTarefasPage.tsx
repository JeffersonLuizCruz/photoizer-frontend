import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FilterX,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { EmptyState } from '@/shared/components/layout/EmptyState'
import { ROUTES, TAREFA_STATUS } from '@/shared/constants'
import { useTarefasList, useUsuariosList, useUpdateTarefaStatus } from '../api/queries'
import type { Tarefa, Usuario } from '../types'
import type { TarefaStatus } from '@/shared/constants'

const tarefaTipoLabels: Record<string, string> = {
  EDITAR_FOTOS: 'Editar Fotos',
  ENVIAR_PARA_SELECAO: 'Enviar para Seleção',
  ENTREGA_FINAL: 'Entrega Final',
}

const tarefaStatusOptions: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: TAREFA_STATUS.PENDENTE, label: 'Pendente' },
  { value: TAREFA_STATUS.EM_ANDAMENTO, label: 'Em Andamento' },
  { value: TAREFA_STATUS.CONCLUIDA, label: 'Concluída' },
  { value: TAREFA_STATUS.ATRASADA, label: 'Atrasada' },
]

const tarefaStatusConfig: Record<TarefaStatus, { label: string; variant: 'warning' | 'success' | 'info' | 'destructive' }> = {
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  EM_ANDAMENTO: { label: 'Em Andamento', variant: 'info' },
  CONCLUIDA: { label: 'Concluída', variant: 'success' },
  ATRASADA: { label: 'Atrasada', variant: 'destructive' },
}

function TarefaIcon({ status }: { status: TarefaStatus }) {
  if (status === 'CONCLUIDA') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  if (status === 'ATRASADA') return <AlertTriangle className="h-5 w-5 text-destructive" />
  if (status === 'EM_ANDAMENTO') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
  return <Clock className="h-5 w-5 text-amber-500" />
}

function EditorNome({ editorId, usuarios }: { editorId: string | null; usuarios: Usuario[] | undefined }) {
  if (!editorId) return <span className="text-muted-foreground">Não atribuído</span>
  const editor = usuarios?.find((u) => u.id === editorId)
  return <span>{editor?.nome ?? 'Desconhecido'}</span>
}

export function MinhasTarefasPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: tarefas, isLoading } = useTarefasList()
  const { data: usuarios } = useUsuariosList()
  const { mutate: updateStatus } = useUpdateTarefaStatus()

  const filtered = useMemo(() => {
    if (!tarefas) return []
    let list = tarefas

    if (statusFilter) {
      list = list.filter((t) => t.status === statusFilter)
    }

    return list.sort((a, b) => {
      if (a.status === 'ATRASADA' && b.status !== 'ATRASADA') return -1
      if (a.status !== 'ATRASADA' && b.status === 'ATRASADA') return 1
      if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1
      if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1
      return 0
    })
  }, [tarefas, statusFilter])

  const handleMarkConcluida = (tarefa: Tarefa) => {
    updateStatus({ id: tarefa.id, status: TAREFA_STATUS.CONCLUIDA as TarefaStatus })
  }

  const handleMarkEmAndamento = (tarefa: Tarefa) => {
    updateStatus({ id: tarefa.id, status: TAREFA_STATUS.EM_ANDAMENTO as TarefaStatus })
  }

  if (isLoading) return <PageLoading />

  return (
    <div>
      <PageTitle
        title="Minhas Tarefas"
        description="Gerencie as tarefas de pós-produção"
        breadcrumbs={[{ label: 'Tarefas' }]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            {tarefaStatusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {statusFilter && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
            <FilterX className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-16 w-16" />}
          message="Nenhuma tarefa encontrada"
          description={statusFilter ? 'Tente alterar o filtro de status' : 'Nenhuma tarefa foi criada ainda'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((tarefa) => {
            const statusConfig = tarefaStatusConfig[tarefa.status as TarefaStatus] ?? tarefaStatusConfig.PENDENTE
            const isAtrasada = tarefa.status === 'ATRASADA' || (tarefa.status === 'PENDENTE' && tarefa.dataLimite && new Date(tarefa.dataLimite) < new Date())

            return (
              <div
                key={tarefa.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors"
              >
                <TarefaIcon status={tarefa.status as TarefaStatus} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {tarefaTipoLabels[tarefa.tipo] ?? tarefa.tipo}
                    </span>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    {isAtrasada && !tarefa.dataConclusao && (
                      <Badge variant="destructive">Atrasada</Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Editor: <EditorNome editorId={tarefa.responsavelId} usuarios={usuarios} />
                    </span>
                    {tarefa.dataLimite && (
                      <span>
                        Prazo: {format(new Date(tarefa.dataLimite), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                    {tarefa.dataConclusao && (
                      <span>
                        Concluída em: {format(new Date(tarefa.dataConclusao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                    <span>
                      Agendamento: {tarefa.agendamentoId.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {tarefa.status !== 'CONCLUIDA' && tarefa.status !== 'ATRASADA' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkConcluida(tarefa)}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Concluir
                    </Button>
                  )}
                  {tarefa.status === 'PENDENTE' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkEmAndamento(tarefa)}
                    >
                      <Loader2 className="mr-1 h-3 w-3" />
                      Iniciar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', tarefa.agendamentoId))}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
