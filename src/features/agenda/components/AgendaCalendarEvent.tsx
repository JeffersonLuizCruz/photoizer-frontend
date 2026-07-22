import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, MapPin, Star } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'
import type { Agendamento } from '../types'

interface AgendaCalendarEventProps {
  agendamento: Agendamento
  onClick?: (id: string) => void
  compact?: boolean
}

export const statusColors: Record<string, string> = {
  CONFIRMADO: 'bg-emerald-500',
  REALIZADO: 'bg-blue-500',
  AGUARDANDO_PAGAMENTO_FINAL: 'bg-amber-500',
  EM_EDICAO: 'bg-orange-500',
  FOTOS_ENVIADAS_PARA_SELECAO: 'bg-purple-500',
  FOTOS_ENTREGUES: 'bg-teal-500',
  FINALIZADO: 'bg-gray-400',
  CANCELADO: 'bg-red-500',
  NO_SHOW: 'bg-red-500',
}

export const statusBgColors: Record<string, string> = {
  CONFIRMADO: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800',
  REALIZADO: 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800',
  AGUARDANDO_PAGAMENTO_FINAL: 'bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800',
  EM_EDICAO: 'bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:border-orange-800',
  FOTOS_ENVIADAS_PARA_SELECAO: 'bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:border-purple-800',
  FOTOS_ENTREGUES: 'bg-teal-50 border-teal-200 hover:bg-teal-100 dark:bg-teal-950 dark:border-teal-800',
  FINALIZADO: 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700',
  CANCELADO: 'bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:border-red-800',
}

export const statusLabels: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' }> = {
  CONFIRMADO: { label: 'Confirmado', variant: 'info' },
  REALIZADO: { label: 'Realizado', variant: 'success' },
  AGUARDANDO_PAGAMENTO_FINAL: { label: 'Aguardando Pagto', variant: 'warning' },
  EM_EDICAO: { label: 'Em Edição', variant: 'warning' },
  FOTOS_ENVIADAS_PARA_SELECAO: { label: 'Fotos p/ Seleção', variant: 'info' },
  FOTOS_ENTREGUES: { label: 'Fotos Entregues', variant: 'success' },
  FINALIZADO: { label: 'Finalizado', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
  NO_SHOW: { label: 'Não Compareceu', variant: 'destructive' },
}

export function AgendaCalendarEvent({ agendamento, onClick, compact = false }: AgendaCalendarEventProps) {
  const data = format(new Date(agendamento.dataHoraEnsaio), "HH:mm", { locale: ptBR })

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick?.(agendamento.id) }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs transition-colors',
          statusBgColors[agendamento.status] ?? 'bg-muted border-border hover:bg-accent',
        )}
      >
        <span className={cn('h-2 w-2 shrink-0 rounded-full', statusColors[agendamento.status] ?? 'bg-gray-400')} />
        <span className="truncate font-medium">{data}</span>
        {agendamento.ensaioDestaque && <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(agendamento.id) }}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-colors',
        statusBgColors[agendamento.status] ?? 'bg-card border-border hover:bg-accent',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusColors[agendamento.status] ?? 'bg-gray-400')} />
            <span className="truncate text-sm font-medium">{agendamento.clienteNome}</span>
            {agendamento.ensaioDestaque && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(agendamento.dataHoraEnsaio), "dd/MM", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {agendamento.localEnsaio}
            </span>
          </div>
        </div>
        <Badge variant={statusLabels[agendamento.status]?.variant ?? 'default'}>
          {statusLabels[agendamento.status]?.label ?? agendamento.status}
        </Badge>
      </div>
    </button>
  )
}
