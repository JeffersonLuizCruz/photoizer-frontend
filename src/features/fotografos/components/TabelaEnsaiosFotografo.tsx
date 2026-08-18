import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency } from '@/shared/lib/format'
import type { FotografoEnsaiosResponse } from '../types'

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' | 'outline' }> = {
  CONFIRMADO: { label: 'Confirmado', variant: 'warning' },
  REALIZADO: { label: 'Realizado', variant: 'secondary' },
  EM_EDICAO: { label: 'Em Edição', variant: 'secondary' },
  FINALIZADO: { label: 'Finalizado', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
}

interface TabelaEnsaiosFotografoProps {
  ensaios: FotografoEnsaiosResponse[]
  showStudioProfit?: boolean
}

export function TabelaEnsaiosFotografo({ ensaios, showStudioProfit }: TabelaEnsaiosFotografoProps) {
  const numColunas = showStudioProfit ? 9 : 8

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Pacote</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Custos</TableHead>
            <TableHead className="text-right">Partilha</TableHead>
            <TableHead className="text-right">Repasse</TableHead>
            {showStudioProfit && <TableHead className="text-right">Lucro do Estúdio</TableHead>}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ensaios.length === 0 && (
            <TableRow>
              <TableCell colSpan={numColunas} className="py-6 text-center text-sm text-muted-foreground">
                Nenhum ensaio encontrado.
              </TableCell>
            </TableRow>
          )}
          {ensaios.map((e) => {
            const statusInfo = statusMap[e.status] ?? { label: e.status, variant: 'outline' as const }
            return (
              <TableRow key={e.agendamentoId}>
                <TableCell className="font-medium">{e.clienteNome}</TableCell>
                <TableCell>{e.pacoteNome ?? '—'}</TableCell>
                <TableCell className="tabular-nums">
                  {format(new Date(e.dataHoraEnsaio), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(e.valorTotal)}</TableCell>
                <TableCell className="text-right tabular-nums text-rose-500">{formatCurrency(e.custosFotografo)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(e.partilhaFotografo)}</TableCell>
                <TableCell className="text-right tabular-nums text-amber-600">{formatCurrency(e.repassarFotografo)}</TableCell>
                {showStudioProfit && (
                  <TableCell className="text-right tabular-nums text-emerald-600">{formatCurrency(e.lucroCrm)}</TableCell>
                )}
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}