import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Check, Clock, MapPin, User, Users, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { AGENDAMENTO_STATUS } from '@/shared/constants'
import { pacoteColorStyle } from '@/shared/lib/pacote-color'
import type { Agendamento } from '../types'

interface AgendaCalendarEventProps {
  agendamento: Agendamento
  onClick?: (id: string) => void
  compact?: boolean
  /** Formato "tarja" enxuto usado na visão de mês mobile (sem hora/ícone). */
  pill?: boolean
}

export const statusLabels: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' }> = {
  PRE_RESERVA: { label: 'Pré-reserva', variant: 'secondary' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', variant: 'warning' },
  PAGAMENTO_CONFIRMADO: { label: 'Pagamento Confirmado', variant: 'info' },
  CONFIRMADO: { label: 'Confirmado', variant: 'info' },
  REALIZADO: { label: 'Realizado', variant: 'success' },
  AGUARDANDO_PAGAMENTO_FINAL: { label: 'Aguardando Pagto', variant: 'warning' },
  EM_EDICAO: { label: 'Em Edição', variant: 'warning' },
  FINALIZADO: { label: 'Finalizado', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
  NO_SHOW: { label: 'Não Compareceu', variant: 'destructive' },
  RASCUNHO: { label: 'Rascunho', variant: 'secondary' },
}

const STATUS_CONCLUIDO: string[] = [AGENDAMENTO_STATUS.REALIZADO, AGENDAMENTO_STATUS.CONFIRMADO, AGENDAMENTO_STATUS.FINALIZADO]
const STATUS_FALHA: string[] = [AGENDAMENTO_STATUS.CANCELADO, AGENDAMENTO_STATUS.NO_SHOW]

/**
 * Indicador de status sobre a tarja colorida pelo pacote. A cor do evento
 * representa o pacote; o status é comunicado por ícone/formato (nunca só cor).
 */
function StatusMarker({ status, className }: { status: string; className?: string }) {
  const iconClass = cn('shrink-0', className)
  if (STATUS_CONCLUIDO.includes(status)) {
    return <Check className={iconClass} strokeWidth={3} aria-hidden="true" />
  }
  if (STATUS_FALHA.includes(status)) {
    return <X className={iconClass} strokeWidth={3} aria-hidden="true" />
  }
  return <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70', className)} aria-hidden="true" />
}

export function AgendaCalendarEvent({ agendamento, onClick, compact = false, pill = false }: AgendaCalendarEventProps) {
  const hora = format(new Date(agendamento.dataHoraEnsaio), 'HH:mm', { locale: ptBR })
  const isParceiro = agendamento.fotografos?.some((f) => f.status !== 'CANCELADO') ?? false
  const statusLabel = statusLabels[agendamento.status]?.label ?? agendamento.status
  const ariaLabel = `${hora} • ${agendamento.clienteNome ?? 'Cliente'} • Pacote ${agendamento.pacoteNome} • ${statusLabel}`
  const titulo = `${hora} - ${agendamento.clienteNome ?? ''} (${agendamento.pacoteNome}) • ${statusLabel}`

  if (pill) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick?.(agendamento.id) }}
        className={cn(
          'flex w-full items-center gap-1 rounded-sm px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight',
          'ring-1 ring-inset ring-black/10 transition hover:brightness-95 dark:ring-white/15',
        )}
        style={pacoteColorStyle(agendamento.pacoteCor)}
        title={titulo}
        aria-label={ariaLabel}
        data-testid="agenda-calendar-event"
      >
        <span className="min-w-0 flex-1 truncate">{agendamento.clienteNome ?? 'Sem cliente'}</span>
      </button>
    )
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick?.(agendamento.id) }}
        className={cn(
          'flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs font-medium shadow-sm',
          'ring-1 ring-inset ring-black/10 transition hover:brightness-95 dark:ring-white/15',
        )}
        style={pacoteColorStyle(agendamento.pacoteCor)}
        title={titulo}
        aria-label={ariaLabel}
        data-testid="agenda-calendar-event"
      >
        <StatusMarker status={agendamento.status} className="h-3 w-3" />
        <span className="min-w-0 flex-1 truncate">{agendamento.clienteNome ?? 'Sem cliente'}</span>
        {isParceiro && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Users className="ml-auto h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent side="top">Ensaio com parceiro</TooltipContent>
          </Tooltip>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(agendamento.id) }}
      className={cn(
        'w-full rounded-lg border p-3 text-left shadow-sm transition hover:brightness-[0.97]',
        'ring-1 ring-inset ring-black/10 dark:ring-white/15',
      )}
      style={pacoteColorStyle(agendamento.pacoteCor)}
      aria-label={ariaLabel}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusMarker status={agendamento.status} className="h-3.5 w-3.5" />
            <span className="min-w-0 truncate text-sm font-semibold">{agendamento.clienteNome}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-90">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(agendamento.dataHoraEnsaio), 'dd/MM', { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hora}
              {isParceiro ? (
                <Users className="h-3 w-3" aria-hidden="true" />
              ) : (
                <User className="h-3 w-3" aria-hidden="true" />
              )}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {agendamento.localEnsaio}
            </span>
          </div>
        </div>
        <Badge variant={statusLabels[agendamento.status]?.variant ?? 'default'}>
          {statusLabel}
        </Badge>
      </div>
    </button>
  )
}
