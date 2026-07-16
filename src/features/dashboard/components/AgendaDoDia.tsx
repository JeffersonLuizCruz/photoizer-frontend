import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, ArrowRight, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'

interface AgendaDoDiaProps {
  agendamentos: Agendamento[]
  isLoading?: boolean
}

export function AgendaDoDia({ agendamentos, isLoading }: AgendaDoDiaProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="mt-2 h-3 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (agendamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground">
        <CalendarDays className="mb-2 h-6 w-6" />
        <p className="text-sm">Nenhum ensaio hoje</p>
      </div>
    )
  }

  const display = agendamentos.slice(0, 5)

  return (
    <div className="space-y-3">
      {display.map((agendamento) => {
        const hora = format(new Date(agendamento.dataHoraEnsaio), "HH:mm", { locale: ptBR })

        return (
          <div
            key={agendamento.id}
            className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 cursor-pointer"
            onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', agendamento.id))}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
              {hora}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{agendamento.localEnsaio}</span>
                {agendamento.ensaioDestaque && (
                  <Award className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {agendamento.duracaoMinutos > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {agendamento.duracaoMinutos}min
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {agendamentos.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate(ROUTES.AGENDA)}>
          <ArrowRight className="mr-1 h-4 w-4" />
          Ver agenda completa ({agendamentos.length - 5} mais)
        </Button>
      )}
    </div>
  )
}
