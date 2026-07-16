import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
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
    id: 'bloqueiaDiaInteiro',
    header: 'Dia Inteiro',
    cell: ({ row }) => (row.original.bloqueiaDiaInteiro ? 'Sim' : 'Não'),
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
  onDelete: (pacote: Pacote) => void
}

export function PacoteList({ data, isLoading, search, onSearchChange, onDelete }: PacoteListProps) {
  const navigate = useNavigate()

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      globalFilter={search}
      onGlobalFilterChange={onSearchChange}
      emptyMessage="Nenhum pacote encontrado"
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
            onClick={() => onDelete(row)}
            aria-label={`Excluir ${row.nome}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
    />
  )
}
