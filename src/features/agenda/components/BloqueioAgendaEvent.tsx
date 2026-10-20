import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Lock, Users } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { BloqueioAgenda } from '../types'

interface BloqueioAgendaEventProps {
  bloqueio: BloqueioAgenda
  onClick?: (bloqueio: BloqueioAgenda) => void
  compact?: boolean
  pill?: boolean
}

function periodoLabel(bloqueio: BloqueioAgenda): string {
  const inicio = new Date(bloqueio.inicio)
  const fim = new Date(bloqueio.fim)
  const mesmoDia = format(inicio, 'yyyy-MM-dd') === format(fim, 'yyyy-MM-dd')
  if (mesmoDia) {
    return `${format(inicio, 'HH:mm')} - ${format(fim, 'HH:mm')}`
  }
  return `${format(inicio, 'dd/MM HH:mm')} - ${format(fim, 'dd/MM HH:mm')}`
}

export function BloqueioAgendaEvent({ bloqueio, onClick, compact = false, pill = false }: BloqueioAgendaEventProps) {
  const profissional = bloqueio.profissionalNome ?? 'Toda a equipe'
  const titulo = `${bloqueio.titulo} • ${profissional} • ${periodoLabel(bloqueio)}`
  const className = 'ring-1 ring-inset ring-amber-500/30 bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100'

  if (pill) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick?.(bloqueio) }}
        className={cn(
          'flex w-full items-center gap-1 rounded-sm px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight',
          'transition hover:brightness-95',
          className,
        )}
        title={titulo}
        aria-label={`Compromisso: ${titulo}`}
        data-testid="agenda-bloqueio-event"
      >
        <Lock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{bloqueio.titulo}</span>
      </button>
    )
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick?.(bloqueio) }}
        className={cn(
          'flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs font-medium shadow-sm',
          'transition hover:brightness-95',
          className,
        )}
        title={titulo}
        aria-label={`Compromisso: ${titulo}`}
        data-testid="agenda-bloqueio-event"
      >
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{bloqueio.titulo}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(bloqueio) }}
      className={cn('w-full rounded-lg border border-amber-500/30 p-3 text-left shadow-sm transition hover:brightness-[0.97]', className)}
      aria-label={`Compromisso: ${titulo}`}
      data-testid="agenda-bloqueio-event"
    >
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate text-sm font-semibold">{bloqueio.titulo}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-90">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {periodoLabel(bloqueio)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {profissional}
        </span>
      </div>
      {bloqueio.descricao && (
        <p className="mt-1 truncate text-xs opacity-80">{bloqueio.descricao}</p>
      )}
    </button>
  )
}

export function formatarPeriodoBloqueio(bloqueio: BloqueioAgenda): string {
  return periodoLabel(bloqueio)
}

export function bloqueioNoDia(bloqueio: BloqueioAgenda, dia: Date): boolean {
  const inicio = new Date(bloqueio.inicio)
  const fim = new Date(bloqueio.fim)
  const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate())
  const fimDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1)
  return inicio < fimDia && fim > inicioDia
}

export function formatarDataBloqueio(bloqueio: BloqueioAgenda): string {
  return format(new Date(bloqueio.inicio), 'dd/MM/yyyy', { locale: ptBR })
}
