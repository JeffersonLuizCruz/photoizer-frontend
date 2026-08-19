import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency } from '@/shared/lib/format'
import type { RentabilidadeTrabalho } from '../types/dashboard.types'

interface RentabilidadePorTrabalhoProps {
  trabalhos: RentabilidadeTrabalho[]
  isLoading?: boolean
}

function roiBadge(roi: number): { label: string; variant: 'success' | 'warning' | 'destructive' } {
  if (roi >= 1) return { label: `${(roi * 100).toFixed(0)}%`, variant: 'success' }
  if (roi >= 0) return { label: `${(roi * 100).toFixed(0)}%`, variant: 'warning' }
  return { label: `${(roi * 100).toFixed(0)}%`, variant: 'destructive' }
}

export function RentabilidadePorTrabalho({ trabalhos, isLoading }: RentabilidadePorTrabalhoProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (trabalhos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem trabalhos no período</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead className="text-right">Valor do trabalho</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">ROI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trabalhos.map((t) => {
            const badge = roiBadge(t.roi)
            return (
              <TableRow key={t.agendamentoId ?? t.clienteNome}>
                <TableCell className="font-medium">{t.clienteNome}</TableCell>
                <TableCell className="text-muted-foreground">{t.tipoServico}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(t.valorTrabalho)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(t.custoTrabalho)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
