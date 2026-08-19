import { useMemo } from 'react'
import { Check, ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { EmptyState } from '@/shared/components/layout/EmptyState'
import { formatCurrency, formatDateBR } from '@/shared/lib/format'
import type { DespesaResponse, StatusDespesa } from '../types/despesa.types'

interface DespesaTableProps {
  despesas: DespesaResponse[]
  isLoading?: boolean
  onPagar: (despesa: DespesaResponse) => void
  onEditar: (despesa: DespesaResponse) => void
  onExcluir: (despesa: DespesaResponse) => void
}

const statusBadge: Record<StatusDespesa, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  PAGO: { label: 'Pago', variant: 'success' },
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  RECORRENTE: { label: 'Recorrente', variant: 'info' },
}

const recorrenciaLabels: Record<string, string> = {
  UNICA: 'Única',
  MENSAL: 'Mensal',
  ANUAL: 'Anual',
}

interface Grupo {
  categoria: string
  cor: string | null
  subtotal: number
  despesas: DespesaResponse[]
}

export function DespesaTable({ despesas, isLoading, onPagar, onEditar, onExcluir }: DespesaTableProps) {
  const grupos = useMemo<Grupo[]>(() => {
    const map = new Map<string, Grupo>()
    for (const d of despesas) {
      const key = d.categoria || 'Outros'
      const existing = map.get(key)
      if (existing) {
        existing.subtotal += d.valor
        existing.despesas.push(d)
      } else {
        map.set(key, {
          categoria: key,
          cor: d.cor,
          subtotal: d.valor,
          despesas: [d],
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.subtotal - a.subtotal)
  }, [despesas])

  const totalGeral = useMemo(() => despesas.reduce((acc, d) => acc + d.valor, 0), [despesas])
  const totalPendente = useMemo(
    () => despesas.filter((d) => d.status === 'PENDENTE').reduce((acc, d) => acc + d.valor, 0),
    [despesas],
  )

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Carregando despesas...</div>
  }

  if (despesas.length === 0) {
    return <EmptyState message="Nenhuma despesa encontrada" description="Ajuste os filtros ou registre uma nova despesa." />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">Total: {formatCurrency(totalGeral)}</Badge>
        <Badge variant="warning">Pendente: {formatCurrency(totalPendente)}</Badge>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.map((grupo) => (
              <DespesaGrupoRows
                key={grupo.categoria}
                grupo={grupo}
                onPagar={onPagar}
                onEditar={onEditar}
                onExcluir={onExcluir}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function DespesaGrupoRows({
  grupo,
  onPagar,
  onEditar,
  onExcluir,
}: {
  grupo: Grupo
  onPagar: (despesa: DespesaResponse) => void
  onEditar: (despesa: DespesaResponse) => void
  onExcluir: (despesa: DespesaResponse) => void
}) {
  return (
    <>
      <TableRow className="bg-muted/40">
        <TableCell colSpan={5} className="font-medium">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: grupo.cor ?? '#94a3b8' }} />
            {grupo.categoria}
            <span className="text-xs text-muted-foreground">({grupo.despesas.length})</span>
          </span>
        </TableCell>
        <TableCell className="text-right font-semibold">{formatCurrency(grupo.subtotal)}</TableCell>
        <TableCell />
      </TableRow>
      {grupo.despesas.map((d) => {
        const badge = statusBadge[d.status]
        return (
          <TableRow key={d.id}>
            <TableCell className="text-muted-foreground">—</TableCell>
            <TableCell>
              <div className="font-medium">{d.descricao}</div>
              {d.observacao && <div className="text-xs text-muted-foreground">{d.observacao}</div>}
              {d.urlComprovante && (
                <a
                  href={d.urlComprovante}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Comprovante
                </a>
              )}
            </TableCell>
            <TableCell>{formatDateBR(d.data)}</TableCell>
            <TableCell>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{recorrenciaLabels[d.recorrencia] ?? d.recorrencia}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(d.valor)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ações">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {d.status !== 'PAGO' && (
                    <DropdownMenuItem onClick={() => onPagar(d)}>
                      <Check className="mr-2 h-4 w-4 text-emerald-500" />
                      Marcar como pago
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onEditar(d)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onExcluir(d)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}
