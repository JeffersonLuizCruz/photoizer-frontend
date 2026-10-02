import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, MapPin, Star, User, Users } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import type { Agendamento } from '../types'

interface AgendaCalendarEventProps {
  agendamento: Agendamento
  onClick?: (id: string) => void
  compact?: boolean
}

export const statusColors: Record<string, string> = {
  PRE_RESERVA: 'bg-slate-400',
  AGUARDANDO_APROVACAO: 'bg-indigo-400',
  PAGAMENTO_CONFIRMADO: 'bg-cyan-400',
  CONFIRMADO: 'bg-emerald-500',
  REALIZADO: 'bg-blue-500',
  AGUARDANDO_PAGAMENTO_FINAL: 'bg-amber-500',
  EM_EDICAO: 'bg-orange-500',
  FINALIZADO: 'bg-gray-400',
  CANCELADO: 'bg-rose-400',
  NO_SHOW: 'bg-rose-400',
  RASCUNHO: 'bg-slate-300',
}

export const statusBgColors: Record<string, string> = {
  PRE_RESERVA: 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700',
  AGUARDANDO_APROVACAO: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950 dark:border-indigo-800',
  PAGAMENTO_CONFIRMADO: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950 dark:border-cyan-800',
  CONFIRMADO: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800',
  REALIZADO: 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800',
  AGUARDANDO_PAGAMENTO_FINAL: 'bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800',
  EM_EDICAO: 'bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:border-orange-800',
  FINALIZADO: 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700',
  CANCELADO: 'bg-rose-50 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:border-rose-800',
  RASCUNHO: 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700',
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

export function AgendaCalendarEvent({ agendamento, onClick, compact = false }: AgendaCalendarEventProps) {
  const data = format(new Date(agendamento.dataHoraEnsaio), "HH:mm", { locale: ptBR })
  const isParceiro = agendamento.fotografos?.some((f) => f.status !== 'CANCELADO') ?? false

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
        <Tooltip>
          <TooltipTrigger asChild>
            {isParceiro ? (
              <Users className="h-2.5 w-2.5 shrink-0 text-violet-500" />
            ) : (
              <User className="h-2.5 w-2.5 shrink-0 text-slate-400" />
            )}
          </TooltipTrigger>
          <TooltipContent side="top">
            {isParceiro ? 'Ensaio com parceiro' : 'Ensaio próprio'}
          </TooltipContent>
        </Tooltip>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  {isParceiro ? (
                    <Users className="h-3 w-3 text-violet-500" />
                  ) : (
                    <User className="h-3 w-3 text-slate-400" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {isParceiro ? 'Ensaio com parceiro' : 'Ensaio próprio'}
                </TooltipContent>
              </Tooltip>
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
