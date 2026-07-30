import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'

interface EntregasPendentesProps {
  agendamentos: Agendamento[]
  isLoading?: boolean
}

export function EntregasPendentes({ agendamentos, isLoading }: EntregasPendentesProps) {
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
        const statusLabel = agendamento.status === AGENDAMENTO_STATUS.EM_EDICAO ? 'Em Edição' : 'Fotos p/ Seleção'

        return (
          <div
            key={agendamento.id}
            className="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', agendamento.id))}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{agendamento.localEnsaio}</p>
              <p className="text-xs text-muted-foreground">
                {statusLabel}
                {agendamento.dataEnvioSelecao && (
                  <span> — Enviado em {format(new Date(agendamento.dataEnvioSelecao), "dd/MM", { locale: ptBR })}</span>
                )}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
