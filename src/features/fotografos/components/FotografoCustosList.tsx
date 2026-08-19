import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency } from '@/shared/lib/format'
import { useCustosFotografo } from '../api/queries'

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  PAGO: 'success',
  PENDENTE: 'warning',
  RECORRENTE: 'outline',
}

interface FotografoCustosListProps {
  fotografoId: string
}

export function FotografoCustosList({ fotografoId }: FotografoCustosListProps) {
  const { data: custos = [], isLoading } = useCustosFotografo(fotografoId)

  if (isLoading) {
    return <div className="animate-pulse h-48 w-full bg-muted rounded" />
  }

  const total = custos.reduce((acc, c) => acc + c.valor, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {custos.length} custo{custos.length !== 1 ? 's' : ''} encontrado{custos.length !== 1 ? 's' : ''}
        </p>
        <p className="text-sm font-semibold">
          Total: <span className="text-rose-500">{formatCurrency(total)}</span>
        </p>
      </div>

      {custos.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum custo vinculado a este fotógrafo.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.descricao}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.cor ?? '#888' }} />
                      {c.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {format(new Date(c.data), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-rose-500">
                    {formatCurrency(c.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status] ?? 'outline'}>
                      {c.status === 'PAGO' ? 'Pago' : c.status === 'PENDENTE' ? 'Pendente' : 'Recorrente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}