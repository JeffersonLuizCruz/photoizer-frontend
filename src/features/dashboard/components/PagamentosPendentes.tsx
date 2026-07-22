import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, CreditCard } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { RegistrarPagamentoDialog } from '@/features/agenda/components/RegistrarPagamentoDialog'
import type { Agendamento } from '@/features/agenda/types'

interface PagamentosPendentesProps {
  agendamentos: Agendamento[]
  isLoading?: boolean
}

export function PagamentosPendentes({ agendamentos, isLoading }: PagamentosPendentesProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = agendamentos.find((a) => a.id === selectedId)

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
        <DollarSign className="mb-2 h-6 w-6" />
        <p className="text-sm">Nenhum pagamento pendente</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {agendamentos.map((agendamento) => {
          const data = format(new Date(agendamento.dataHoraEnsaio), "dd/MM", { locale: ptBR })

          return (
            <div
              key={agendamento.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {agendamento.clienteId.slice(0, 8)}... — {data}
                </p>
                <p className="text-xs text-muted-foreground">
                  Restante: R$ {agendamento.saldoDevedor.toFixed(2)}
                </p>
              </div>
              <Button variant="default" size="sm" className="shrink-0 ml-3" onClick={() => setSelectedId(agendamento.id)}>
                <CreditCard className="mr-1 h-3 w-3" />
                Pagamento
              </Button>
            </div>
          )
        })}
      </div>

      {selected && (
        <RegistrarPagamentoDialog
          open={!!selectedId}
          onOpenChange={(open) => { if (!open) setSelectedId(null) }}
          agendamento={selected}
        />
      )}
    </>
  )
}
