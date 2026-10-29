import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowRight, Camera, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { AGENDAMENTO_STATUS, ROUTES } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'

const MAX_VISIVEIS = 5

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

  const visiveis = agendamentos.slice(0, MAX_VISIVEIS)

  return (
    <div className="space-y-2">
      {visiveis.map((agendamento) => {
        const desde = agendamento.dataRealizacao ?? agendamento.dataHoraEnsaio

        return (
          <button
            key={agendamento.id}
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
            onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', agendamento.id))}
            aria-label={`Abrir entrega pendente de ${agendamento.clienteNome ?? 'cliente não informado'}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {agendamento.clienteNome ?? 'Cliente não informado'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {agendamento.pacoteNome}
                {agendamento.localEnsaio ? ` · ${agendamento.localEnsaio}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Em edição {formatDistanceToNow(new Date(desde), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        )
      })}

      {agendamentos.length > MAX_VISIVEIS && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate(`${ROUTES.AGENDA}?status=${AGENDAMENTO_STATUS.EM_EDICAO}`)}
        >
          <ArrowRight className="mr-1 h-4 w-4" aria-hidden="true" />
          Ver todas as {agendamentos.length} entregas
        </Button>
      )}
    </div>
  )
}
