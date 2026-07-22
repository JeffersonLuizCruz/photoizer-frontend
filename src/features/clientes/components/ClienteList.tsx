import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { DataTable } from '@/shared/components/layout/DataTable'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { ROUTES } from '@/shared/constants'
import type { Cliente } from '../types'
import type { ColumnDef } from '@tanstack/react-table'

const ORIGEM_LABELS: Record<string, string> = {
  INDICACAO: 'Indicação',
  ANUNCIO: 'Anúncio',
  OUTROS: 'Outros',
}

interface ClienteListProps {
  data: Cliente[]
  isLoading: boolean
  pageCount: number
  pageIndex: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onDelete: (cliente: Cliente) => void
  search: string
  onSearchChange: (search: string) => void
}

export function ClienteList({
  data,
  isLoading,
  pageCount,
  pageIndex,
  onPageChange,
  onPageSizeChange,
  onDelete,
  search,
  onSearchChange,
}: ClienteListProps) {
  const navigate = useNavigate()

  const columns = useMemo<ColumnDef<Cliente>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="h-auto p-0 text-sm font-medium"
          onClick={() => navigate(ROUTES.CLIENTES_DETALHES.replace(':id', row.original.id))}
        >
          {row.original.nome}
        </Button>
      ),
    },
    {
      accessorKey: 'telefone',
      header: 'Telefone',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'origem',
      header: 'Origem',
      cell: ({ row }) => ORIGEM_LABELS[row.original.origem] || row.original.origem,
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => <StatusBadge status="active" customLabels={{ active: { label: 'Ativo', variant: 'success' } }} />,
    },
  ], [navigate])

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      pageCount={pageCount}
      pageIndex={pageIndex}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      globalFilter={search}
      onGlobalFilterChange={onSearchChange}
      emptyMessage="Nenhum cliente encontrado"
      renderActions={(row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`${ROUTES.CLIENTES}/${row.id}/editar`)}
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
