import { useNavigate } from 'react-router-dom'
import { Pencil, Power, PowerOff } from 'lucide-react'
import { DataTable } from '@/shared/components/layout/DataTable'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import type { Pacote } from '../types'
import type { ColumnDef } from '@tanstack/react-table'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const columns: ColumnDef<Pacote>[] = [
  {
    accessorKey: 'nome',
    header: 'Nome',
  },
  {
    accessorKey: 'quantidadeFotos',
    header: 'Fotos',
  },
  {
    accessorKey: 'quantidadeVideos',
    header: 'Vídeos',
  },
  {
    accessorKey: 'valorBase',
    header: 'Valor Base',
    cell: ({ row }) => formatCurrency(row.original.valorBase),
  },
  {
    accessorKey: 'duracaoEstimada',
    header: 'Duração',
  },
  {
    id: 'diasParaEntrega',
    header: 'Prazo',
    cell: ({ row }) => row.original.diasParaEntrega ? `${row.original.diasParaEntrega} dias` : '—',
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) =>
      row.original.ativo ? (
        <StatusBadge status="active" customLabels={{ active: { label: 'Ativo', variant: 'success' } }} />
      ) : (
        <StatusBadge status="inactive" customLabels={{ inactive: { label: 'Inativo', variant: 'secondary' } }} />
      ),
  },
]

interface PacoteListProps {
  data: Pacote[]
  isLoading: boolean
  search: string
  onSearchChange: (search: string) => void
  onToggleAtivo: (pacote: Pacote) => void
}

export function PacoteList({ data, isLoading, search, onSearchChange, onToggleAtivo }: PacoteListProps) {
  const navigate = useNavigate()

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      globalFilter={search}
      onGlobalFilterChange={onSearchChange}
      emptyMessage="Nenhum pacote encontrado"
      mobileHiddenIds={['quantidadeVideos', 'diasParaEntrega', 'duracaoEstimada']}
      minWidthClassName="min-w-[560px]"
      renderMobileCard={(p) => (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{p.nome}</p>
            {p.ativo ? (
              <StatusBadge status="active" customLabels={{ active: { label: 'Ativo', variant: 'success' } }} />
            ) : (
              <StatusBadge status="inactive" customLabels={{ inactive: { label: 'Inativo', variant: 'secondary' } }} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Fotos</span>
              <span>{p.quantidadeFotos}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Vídeos</span>
              <span>{p.quantidadeVideos}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Valor</span>
              <span className="tabular-nums">{formatCurrency(p.valorBase)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Duração</span>
              <span>{p.duracaoEstimada ?? '—'}</span>
            </div>
            {p.diasParaEntrega ? (
              <div className="col-span-2 flex justify-between gap-2">
                <span className="text-muted-foreground">Prazo</span>
                <span>{p.diasParaEntrega} dias</span>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/pacotes/${p.id}/editar`)}
              aria-label={`Editar ${p.nome}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleAtivo(p)}
              aria-label={p.ativo ? `Inativar ${p.nome}` : `Ativar ${p.nome}`}
            >
              {p.ativo ? (
                <PowerOff className="h-4 w-4 text-destructive" />
              ) : (
                <Power className="h-4 w-4 text-green-600" />
              )}
            </Button>
          </div>
        </div>
      )}
      renderActions={(row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/pacotes/${row.id}/editar`)}
            aria-label={`Editar ${row.nome}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleAtivo(row)}
            aria-label={row.ativo ? `Inativar ${row.nome}` : `Ativar ${row.nome}`}
            title={row.ativo ? 'Inativar' : 'Ativar'}
          >
            {row.ativo ? (
              <PowerOff className="h-4 w-4 text-destructive" />
            ) : (
              <Power className="h-4 w-4 text-green-600" />
            )}
          </Button>
        </div>
      )}
    />
  )
}
