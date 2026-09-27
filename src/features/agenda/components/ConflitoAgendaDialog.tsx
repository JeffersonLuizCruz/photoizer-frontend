import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import { usePacotesList, useDisponibilidade } from '../api/queries'
import type { Agendamento } from '../types'

interface ConflitoAgendaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

export function ConflitoAgendaDialog({ open, onOpenChange, agendamento }: ConflitoAgendaDialogProps) {
  const navigate = useNavigate()
  const { data: pacotes = [] } = usePacotesList()

  const pacote = pacotes.find((p) => p.id === agendamento.pacoteId)
  const dataEnsaio = new Date(agendamento.dataHoraEnsaio)

  const { data: disponibilidade } = useDisponibilidade(
    open ? dataEnsaio : undefined,
    open ? format(dataEnsaio, 'HH:mm') : undefined,
    agendamento.duracaoMinutos,
    pacote?.bloqueiaDiaInteiro ?? false,
    agendamento.fotografoId ?? undefined,
    agendamento.id,
  )

  const conflitos = disponibilidade?.conflitos ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Conflito de agenda
          </DialogTitle>
          <DialogDescription>
            Não foi possível aprovar: já existe um agendamento ocupando este horário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">
              {agendamento.clienteNome ?? 'Este ensaio'} —{' '}
              <span className="font-medium text-foreground">
                {format(dataEnsaio, 'dd/MM/yyyy HH:mm')}
              </span>{' '}
              em {agendamento.localEnsaio}
            </p>
          </div>

          {conflitos.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-destructive">Agendamentos em conflito</p>
              <ul className="mt-2 space-y-2">
                {conflitos.map((c) => (
                  <li key={c.agendamentoId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {c.clienteNome || 'Agendamento'} — {c.horario}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false)
                        navigate(`${ROUTES.AGENDA}/${c.agendamentoId}/editar`)
                      }}
                    >
                      Editar
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Ajuste o horário ou o fotógrafo responsável deste ensaio, ou edite o ensaio conflitante para liberar o
            horário.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              navigate(`${ROUTES.AGENDA}/${agendamento.id}/editar`)
            }}
          >
            Editar este ensaio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
