import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency, formatDateBR } from '@/shared/lib/format'
import type { Lancamento } from '../types/dashboard.types'

interface UltimosLancamentosProps {
  lancamentos: Lancamento[]
  isLoading?: boolean
}

function statusBadge(status: Lancamento['status']): { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' } {
  switch (status) {
    case 'PAGO_TOTAL':
    case 'PAGO':
      return { label: 'Pago', variant: 'success' }
    case 'PAGO_PARCIAL':
      return { label: 'Parcial', variant: 'warning' }
    case 'PENDENTE':
      return { label: 'Pendente', variant: 'warning' }
    case 'CANCELADO':
      return { label: 'Cancelado', variant: 'destructive' }
    default:
      return { label: 'Recorrente', variant: 'info' }
  }
}

function origemLabel(origem: string): string {
  switch (origem) {
    case 'AGENDAMENTO':
      return 'Ensaio'
    case 'ECOMMERCE':
      return 'E-commerce'
    case 'DESPESA':
      return 'Despesa'
    case 'RECORRENTE':
      return 'Recorrente'
    default:
      return 'Avulsa'
  }
}

export function UltimosLancamentos({ lancamentos, isLoading }: UltimosLancamentosProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (lancamentos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem lançamentos no período</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lancamentos.map((l) => {
          const isReceita = l.tipo === 'RECEITA'
          const badge = statusBadge(l.status)
          return (
            <TableRow key={l.id}>
              <TableCell>
                <Badge variant={isReceita ? 'success' : 'secondary'} className="gap-1">
                  {isReceita ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                  {isReceita ? 'Receita' : 'Despesa'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDateBR(l.data)}</TableCell>
              <TableCell>
                <div className="font-medium">{l.descricao}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
                    {origemLabel(l.origem)}
                  </Badge>
                  <span>{l.categoria}</span>
                </div>
              </TableCell>
              <TableCell className={isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-300'}>
                {isReceita ? '+' : '−'}{formatCurrency(l.valor)}
              </TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
