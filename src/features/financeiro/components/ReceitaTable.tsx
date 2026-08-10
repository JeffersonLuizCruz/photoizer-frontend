import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { EmptyState } from '@/shared/components/layout/EmptyState'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { formatCurrency, formatDateBR } from '@/shared/lib/format'
import type { Receita, StatusReceita } from '../types/receita.types'

interface ReceitaTableProps {
  receitas: Receita[]
  isLoading?: boolean
  onReceber: (receita: Receita) => void
  onEditar: (receita: Receita) => void
  onDuplicar: (receita: Receita) => void
  onExcluir: (receita: Receita) => void
}

const statusBadge: Record<StatusReceita, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  PAGO_TOTAL: { label: 'Pago total', variant: 'success' },
  PAGO_PARCIAL: { label: 'Pago parcial', variant: 'warning' },
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
}

const tipoServicoLabels: Record<string, string> = {
  ENSAIO: 'Ensaio',
  CASAMENTO: 'Casamento',
  EVENTO: 'Evento',
  PRODUTO: 'Produto',
  OUTRO: 'Outro',
}

export function ReceitaTable({ receitas, isLoading, onReceber, onEditar, onDuplicar, onExcluir }: ReceitaTableProps) {
  if (isLoading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Carregando receitas...</div>
  }

  if (receitas.length === 0) {
    return <EmptyState message="Nenhuma receita encontrada" description="Ajuste os filtros ou registre uma nova receita." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Serviço</TableHead>
          <TableHead>Previsão</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor bruto</TableHead>
          <TableHead className="text-right">Valor final</TableHead>
          <TableHead className="text-right">Recebido</TableHead>
          <TableHead className="w-[70px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {receitas.map((r) => {
          const badge = statusBadge[r.status]
          return (
            <TableRow key={r.id} className={r.status === 'CANCELADO' ? 'opacity-50' : undefined}>
              <TableCell>
                <div className="font-medium">{r.clienteNome}</div>
                {r.descricao && <div className="text-xs text-muted-foreground">{r.descricao}</div>}
              </TableCell>
              <TableCell className="text-muted-foreground">{tipoServicoLabels[r.tipoServico] ?? r.tipoServico}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateBR(r.dataPrevisaoRecebimento)}</TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(r.valorBruto)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatCurrency(r.valorFinal)}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(r.valorRecebido)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {r.status !== 'PAGO_TOTAL' && r.status !== 'CANCELADO' && (
                      <DropdownMenuItem onClick={() => onReceber(r)}>
                        <Check className="mr-2 h-4 w-4 text-emerald-500" />
                        Marcar como recebida
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEditar(r)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicar(r)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onExcluir(r)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
