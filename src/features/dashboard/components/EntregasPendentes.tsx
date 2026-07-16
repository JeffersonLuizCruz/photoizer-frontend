import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Camera, Clock, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'

interface EntregasPendentesProps {
  agendamentos: Agendamento[]
  tarefas?: { agendamentoId: string; dataLimite: string | null; status: string }[]
  isLoading?: boolean
}

function getDiasRestantes(agendamento: Agendamento, tarefas?: EntregasPendentesProps['tarefas']): number | null {
  const tarefa = tarefas?.find((t) => t.agendamentoId === agendamento.id && t.status !== 'CONCLUIDA')
  if (tarefa?.dataLimite) {
    return differenceInDays(new Date(tarefa.dataLimite), new Date())
  }
  return null
}

export function EntregasPendentes({ agendamentos, tarefas, isLoading }: EntregasPendentesProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="mt-2 h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (agendamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground">
        <Camera className="mb-2 h-6 w-6" />
        <p className="text-sm">Nenhuma entrega pendente</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {agendamentos.map((agendamento) => {
        const diasRestantes = getDiasRestantes(agendamento, tarefas)
        const statusLabel = agendamento.status === AGENDAMENTO_STATUS.EM_EDICAO ? 'Em Edição' : 'Fotos p/ Seleção'
        const isUrgente = diasRestantes !== null && diasRestantes <= 1

        return (
          <div
            key={agendamento.id}
            className="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', agendamento.id))}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{agendamento.localEnsaio}</p>
                {isUrgente && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {statusLabel}
                {agendamento.dataEnvioSelecao && (
                  <span> — Enviado em {format(new Date(agendamento.dataEnvioSelecao), "dd/MM", { locale: ptBR })}</span>
                )}
              </p>
            </div>
            {diasRestantes !== null && (
              <div className={`shrink-0 ml-3 text-xs font-medium tabular-nums ${isUrgente ? 'text-destructive' : diasRestantes <= 3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                <Clock className="mr-0.5 h-3 w-3 inline" />
                {diasRestantes <= 0 ? 'Vencido' : `${diasRestantes}d`}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
