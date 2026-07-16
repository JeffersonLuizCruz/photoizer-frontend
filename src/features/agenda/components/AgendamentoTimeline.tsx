import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Circle, XCircle, Clock, CalendarCheck, Send, FileCheck, Star, AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { Agendamento, Tarefa } from '../types'
import { AGENDAMENTO_STATUS } from '@/shared/constants'

interface TimelineEvent {
  data: string | null
  label: string
  icon: React.ComponentType<{ className?: string }>
  status: 'completed' | 'pending' | 'current' | 'cancelled'
}

interface AgendamentoTimelineProps {
  agendamento: Agendamento
  tarefas?: Tarefa[]
}

function buildTimelineEvents(agendamento: Agendamento): TimelineEvent[] {
  const events: TimelineEvent[] = []

  events.push({
    data: agendamento.createdAt,
    label: 'Agendamento Criado',
    icon: CalendarCheck,
    status: 'completed',
  })

  if (agendamento.dataConfirmacao) {
    events.push({
      data: agendamento.dataConfirmacao,
      label: 'Agendamento Confirmado',
      icon: CheckCircle2,
      status: agendamento.status === AGENDAMENTO_STATUS.CANCELADO ? 'cancelled' : 'completed',
    })
  }

  const statusStr = agendamento.status as string

  if (statusStr === 'CANCELADO' || statusStr === 'NO_SHOW') {
    events.push({
      data: agendamento.updatedAt,
      label: statusStr === 'NO_SHOW' ? 'Cliente Não Compareceu' : 'Agendamento Cancelado',
      icon: XCircle,
      status: 'cancelled',
    })
    return events
  }

  if (agendamento.dataRealizacao) {
    events.push({
      data: agendamento.dataRealizacao,
      label: 'Ensaio Realizado',
      icon: Star,
      status: 'completed',
    })
  }

  if (agendamento.dataEnvioSelecao) {
    events.push({
      data: agendamento.dataEnvioSelecao,
      label: 'Fotos Enviadas para Seleção',
      icon: Send,
      status: 'completed',
    })
  }

  if (agendamento.dataEntregaFinal) {
    events.push({
      data: agendamento.dataEntregaFinal,
      label: 'Fotos Entregues',
      icon: FileCheck,
      status: 'completed',
    })
  }

  if (agendamento.dataFinalizacao) {
    events.push({
      data: agendamento.dataFinalizacao,
      label: 'Agendamento Finalizado',
      icon: CheckCircle2,
      status: 'completed',
    })
  }

  if (!agendamento.dataFinalizacao && statusStr !== 'CANCELADO' && statusStr !== 'NO_SHOW') {
    const statusLabel: Record<string, string> = {
      CONFIRMADO: 'Aguardando Realização',
      REALIZADO: 'Aguardando Pagamento',
      AGUARDANDO_PAGAMENTO_FINAL: 'Aguardando Pagamento Final',
      EM_EDICAO: 'Em Edição',
      FOTOS_ENVIADAS_PARA_SELECAO: 'Aguardando Confirmação de Entrega',
      FOTOS_ENTREGUES: 'Aguardando Finalização',
    }
    const label = statusLabel[statusStr]

    if (label) {
      events.push({
        data: null,
        label,
        icon: Clock,
        status: 'current',
      })
    }
  }

  return events
}

function TimelineDot({ status }: { status: TimelineEvent['status'] }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border-2',
          status === 'completed' && 'border-emerald-500 bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
          status === 'current' && 'border-blue-500 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
          status === 'pending' && 'border-muted-foreground/30 bg-muted text-muted-foreground',
          status === 'cancelled' && 'border-destructive bg-destructive/10 text-destructive',
        )}
      >
        {status === 'pending' ? <Circle className="h-4 w-4" /> : status === 'cancelled' ? <XCircle className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-current" />}
      </div>
    </div>
  )
}

export function AgendamentoTimeline({ agendamento, tarefas }: AgendamentoTimelineProps) {
  const events = buildTimelineEvents(agendamento)

  const tarefasAtrasadas = tarefas?.filter(
    (t) => t.status === 'PENDENTE' && t.dataLimite && new Date(t.dataLimite) < new Date(),
  )

  return (
    <div className="space-y-0">
      {tarefasAtrasadas && tarefasAtrasadas.length > 0 && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{tarefasAtrasadas.length} tarefa(s) atrasada(s)</span>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-px bg-border" />

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex gap-4">
              <div className="relative z-10 bg-background">
                <TimelineDot status={event.status} />
              </div>

              <div className="flex-1 pb-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    event.status === 'cancelled' && 'text-destructive line-through',
                    event.status === 'current' && 'text-blue-600 dark:text-blue-400',
                  )}
                >
                  {event.label}
                </p>
                {event.data && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.data), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    {event.status === 'completed' && event.data && agendamento.createdAt && index > 0 && (
                      <span className="ml-2">
                        ({differenceInDays(new Date(event.data), new Date(agendamento.createdAt))} dias após criação)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
