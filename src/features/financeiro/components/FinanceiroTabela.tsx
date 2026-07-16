import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/shared/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento } from '@/features/agenda/types'
import type { DateRange } from '@/shared/components/layout/DateRangePicker'

const statusLabels: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary' }> = {
  [AGENDAMENTO_STATUS.CONFIRMADO]: { label: 'Confirmado', variant: 'info' },
  [AGENDAMENTO_STATUS.REALIZADO]: { label: 'Realizado', variant: 'success' },
  [AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL]: { label: 'Aguard. Pagto', variant: 'warning' },
  [AGENDAMENTO_STATUS.EM_EDICAO]: { label: 'Em Edição', variant: 'warning' },
  [AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO]: { label: 'Fotos p/ Seleção', variant: 'info' },
  [AGENDAMENTO_STATUS.FOTOS_ENTREGUES]: { label: 'Fotos Entregues', variant: 'success' },
  [AGENDAMENTO_STATUS.FINALIZADO]: { label: 'Finalizado', variant: 'success' },
  [AGENDAMENTO_STATUS.CANCELADO]: { label: 'Cancelado', variant: 'destructive' },
  [AGENDAMENTO_STATUS.NO_SHOW]: { label: 'Não Compareceu', variant: 'destructive' },
}

interface FinanceiroTabelaProps {
  agendamentos: Agendamento[]
  dateRange?: DateRange
  isLoading?: boolean
}

export function FinanceiroTabela({ agendamentos, dateRange, isLoading }: FinanceiroTabelaProps) {
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    let list = agendamentos

    if (dateRange?.from) {
      list = list.filter((a) => new Date(a.dataHoraEnsaio) >= dateRange.from!)
    }
    if (dateRange?.to) {
      list = list.filter((a) => new Date(a.dataHoraEnsaio) <= dateRange.to!)
    }

    return list.sort((a, b) => new Date(b.dataHoraEnsaio).getTime() - new Date(a.dataHoraEnsaio).getTime())
  }, [agendamentos, dateRange])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse h-8 w-full bg-muted rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse h-12 w-full bg-muted rounded" />
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">Nenhum agendamento encontrado</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-right">Entrada</TableHead>
            <TableHead className="text-right">Restante</TableHead>
            <TableHead className="text-right">Extras</TableHead>
            <TableHead className="text-right">Total Final</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((agendamento) => {
            const config = statusLabels[agendamento.status] ?? { label: agendamento.status, variant: 'default' as const }
            return (
              <TableRow
                key={agendamento.id}
                className="cursor-pointer"
                onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', agendamento.id))}
              >
                <TableCell>
                  {format(new Date(agendamento.dataHoraEnsaio), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-medium">{agendamento.clienteId.slice(0, 8)}...</TableCell>
                <TableCell>{agendamento.localEnsaio}</TableCell>
                <TableCell>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">R$ {agendamento.valorTotal.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className={agendamento.valorEntradaPago > 0 ? 'text-emerald-600' : 'text-muted-foreground'}>
                    R$ {agendamento.valorEntradaPago > 0 ? agendamento.valorEntradaPago.toFixed(2) : '0,00'}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">R$ {agendamento.valorRestante.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {agendamento.valorExtras > 0
                    ? <span className="text-purple-600">R$ {agendamento.valorExtras.toFixed(2)}</span>
                    : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  R$ {agendamento.valorTotalFinal.toFixed(2)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        Exibindo {filtered.length} agendamento(s)
        {dateRange?.from && dateRange?.to && (
          <span> no período selecionado</span>
        )}
      </div>
    </div>
  )
}
