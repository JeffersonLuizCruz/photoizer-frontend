import { format, parseISO } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { cn } from '@/shared/lib/cn'
import { formatarBytes } from '@/shared/lib/bytes'
import type { SnapshotArmazenamento } from '../types/armazenamento.types'

interface HistoricoConsumoTableProps {
  snapshots: SnapshotArmazenamento[]
}

interface Linha extends SnapshotArmazenamento {
  variacao: number | null
}

function montarLinhas(snapshots: SnapshotArmazenamento[]): Linha[] {
  return snapshots
    .map((snapshot, indice) => ({
      ...snapshot,
      variacao: indice === 0 ? null : snapshot.bytesTotal - snapshots[indice - 1].bytesTotal,
    }))
    .reverse()
}

function Variacao({ valor }: { valor: number | null }) {
  if (valor == null) {
    return <span className="text-muted-foreground">—</span>
  }
  if (valor === 0) {
    return <span className="text-muted-foreground">0 B</span>
  }
  const cresceu = valor > 0
  return (
    <span className={cn('tabular-nums', cresceu ? 'text-amber-700' : 'text-emerald-700')}>
      {cresceu ? '+' : '-'}
      {formatarBytes(Math.abs(valor))}
    </span>
  )
}

export function HistoricoConsumoTable({ snapshots }: HistoricoConsumoTableProps) {
  const linhas = montarLinhas(snapshots)

  return (
    <div className="max-h-80 overflow-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Consumo</TableHead>
            <TableHead className="text-right">Variação</TableHead>
            <TableHead className="text-right">Liberado no dia</TableHead>
            <TableHead className="text-right">Livre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha) => (
            <TableRow key={linha.data}>
              <TableCell className="whitespace-nowrap text-sm">
                {format(parseISO(linha.data), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="text-right text-sm font-medium tabular-nums">
                {formatarBytes(linha.bytesTotal)}
              </TableCell>
              <TableCell className="text-right text-xs">
                <Variacao valor={linha.variacao} />
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">
                {linha.bytesLiberadosNoDia > 0 ? (
                  <span className="text-emerald-700">-{formatarBytes(linha.bytesLiberadosNoDia)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                {formatarBytes(linha.volumeLivre)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
