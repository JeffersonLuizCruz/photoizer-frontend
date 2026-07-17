import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import type { Tarefa } from '@/features/agenda/types'
import type { Agendamento } from '@/features/agenda/types'

const tarefaTipoLabels: Record<string, string> = {
  EDITAR_FOTOS: 'Editar Fotos',
  ENVIAR_PARA_SELECAO: 'Enviar para Seleção',
  ENTREGA_FINAL: 'Entrega Final',
}

interface AlertasProps {
  tarefasAtrasadas: Tarefa[]
  ensaiosAmanha: Agendamento[]
}

export function Alertas({ tarefasAtrasadas, ensaiosAmanha }: AlertasProps) {
  const navigate = useNavigate()

  if (tarefasAtrasadas.length === 0 && ensaiosAmanha.length === 0) return null

  return (
    <div className="space-y-3">
      {tarefasAtrasadas.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{tarefasAtrasadas.length} tarefa(s) atrasada(s)</span>
          </div>
          <div className="mt-2 space-y-1">
            {tarefasAtrasadas.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {tarefaTipoLabels[t.tipo] ?? t.tipo}
                  {t.dataLimite && ` — ${format(new Date(t.dataLimite), "dd/MM", { locale: ptBR })}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-0.5 text-xs"
                  onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', t.agendamentoId))}
                >
                  Ver
                </Button>
              </div>
            ))}
            {tarefasAtrasadas.length > 3 && (
              <p className="text-xs text-muted-foreground pt-1">
                e mais {tarefasAtrasadas.length - 3} tarefa(s)
              </p>
            )}
          </div>
        </div>
      )}

      {ensaiosAmanha.length > 0 && (
        <div className="rounded-lg border border-blue-500/50 bg-blue-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <CalendarDays className="h-4 w-4" />
            <span>{ensaiosAmanha.length} ensaio(s) amanhã</span>
          </div>
          <div className="mt-2 space-y-1">
            {ensaiosAmanha.slice(0, 3).map((a) => (
              <div key={a.id} className="text-xs text-muted-foreground">
                {format(new Date(a.dataHoraEnsaio), "HH:mm", { locale: ptBR })} — {a.localEnsaio}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
