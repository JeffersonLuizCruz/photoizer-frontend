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
    <>
      <div className="hidden rounded-md border overflow-x-auto md:block">
      <Table className="min-w-[760px]">
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

      <div className="space-y-3 md:hidden">
        {ensaios.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum ensaio encontrado.</p>
        )}
        {ensaios.map((e) => {
          const statusInfo = statusMap[e.status] ?? { label: e.status, variant: 'outline' as const }
          return (
            <div key={e.agendamentoId} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.clienteNome}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.pacoteNome ?? '—'}</p>
                </div>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {format(new Date(e.dataHoraEnsaio), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(e.valorTotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Custos</span>
                  <span className="tabular-nums text-rose-500">{formatCurrency(e.custosFotografo)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Partilha</span>
                  <span className="tabular-nums">{formatCurrency(e.partilhaFotografo)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Repasse</span>
                  <span className="tabular-nums text-amber-600">{formatCurrency(e.repassarFotografo)}</span>
                </div>
                {showStudioProfit && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Lucro Estúdio</span>
                    <span className="tabular-nums text-emerald-600">{formatCurrency(e.lucroCrm)}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}