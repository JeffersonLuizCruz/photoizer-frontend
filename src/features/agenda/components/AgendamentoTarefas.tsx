import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'
import type { Tarefa } from '../types'
import type { TarefaStatus } from '@/shared/constants'

interface AgendamentoTarefasProps {
  tarefas: Tarefa[]
  isLoading?: boolean
}

const tarefaTipoLabels: Record<string, string> = {
  EDITAR_FOTOS: 'Editar Fotos',
  ENVIAR_PARA_SELECAO: 'Enviar para Seleção',
  ENTREGA_FINAL: 'Entrega Final',
}

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

export function AgendamentoTarefas({ tarefas, isLoading }: AgendamentoTarefasProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="mt-2 h-3 w-48 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (tarefas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="mb-2 h-8 w-8" />
        <p className="text-sm">Nenhuma tarefa encontrada</p>
      </div>
    )
  }

  const sorted = [...tarefas].sort((a, b) => {
    if (a.status === 'ATRASADA' && b.status !== 'ATRASADA') return -1
    if (a.status !== 'ATRASADA' && b.status === 'ATRASADA') return 1
    if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1
    if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1
    return 0
  })

  return (
    <div className="space-y-3">
      {sorted.map((tarefa) => {
        const statusConfig = tarefaStatusConfig[tarefa.status as TarefaStatus] ?? tarefaStatusConfig.PENDENTE
        const isAtrasada = tarefa.status === 'ATRASADA' || (tarefa.status === 'PENDENTE' && tarefa.dataLimite && new Date(tarefa.dataLimite) < new Date())

        return (
          <div
            key={tarefa.id}
            className={cn(
              'flex items-start gap-4 rounded-lg border p-4 transition-colors',
              isAtrasada && 'border-destructive/30 bg-destructive/5',
            )}
          >
            <TarefaIcon status={tarefa.status as TarefaStatus} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{tarefaTipoLabels[tarefa.tipo] ?? tarefa.tipo}</span>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {tarefa.dataLimite && (
                  <span>
                    Prazo: {format(new Date(tarefa.dataLimite), "dd/MM/yyyy", { locale: ptBR })}
                    {isAtrasada && <span className="ml-1 text-destructive font-medium">(Atrasada)</span>}
                  </span>
                )}
                {tarefa.dataConclusao && (
                  <span>
                    Concluída em: {format(new Date(tarefa.dataConclusao), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
