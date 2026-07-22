import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/shared/components/layout/DataTable'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { Button } from '@/shared/components/ui/button'
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import type { Agendamento, Pacote, Usuario } from '../types'

interface AgendamentoListProps {
  agendamentos: Agendamento[]
  isLoading?: boolean
  pacotes?: Pacote[]
  usuarios?: Usuario[]
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' }> = {
  [AGENDAMENTO_STATUS.CONFIRMADO]: { label: 'Confirmado', variant: 'info' },
  [AGENDAMENTO_STATUS.REALIZADO]: { label: 'Realizado', variant: 'success' },
  [AGENDAMENTO_STATUS.AGUARDANDO_PAGAMENTO_FINAL]: { label: 'Aguardando Pagto', variant: 'warning' },
  [AGENDAMENTO_STATUS.EM_EDICAO]: { label: 'Em Edição', variant: 'warning' },
  [AGENDAMENTO_STATUS.FOTOS_ENVIADAS_PARA_SELECAO]: { label: 'Fotos p/ Seleção', variant: 'info' },
  [AGENDAMENTO_STATUS.FOTOS_ENTREGUES]: { label: 'Fotos Entregues', variant: 'success' },
  [AGENDAMENTO_STATUS.FINALIZADO]: { label: 'Finalizado', variant: 'success' },
  [AGENDAMENTO_STATUS.CANCELADO]: { label: 'Cancelado', variant: 'destructive' },
  [AGENDAMENTO_STATUS.NO_SHOW]: { label: 'Não Compareceu', variant: 'destructive' },
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`
}

export function AgendamentoList({ agendamentos, isLoading, pacotes, usuarios }: AgendamentoListProps) {
  const navigate = useNavigate()

  const pacoteMap = useMemo(() => {
    const map = new Map<string, string>()
    pacotes?.forEach((p) => map.set(p.id, p.nome))
    return map
  }, [pacotes])

  const usuarioMap = useMemo(() => {
    const map = new Map<string, string>()
    usuarios?.forEach((u) => map.set(u.id, u.nome))
    return map
  }, [usuarios])

  const columns: ColumnDef<Agendamento>[] = useMemo(
    () => [
      {
        accessorKey: 'dataHoraEnsaio',
        header: 'Data/Hora',
        cell: ({ row }) => {
          const data = row.original.dataHoraEnsaio
          return (
            <span className="whitespace-nowrap text-sm">
              {format(new Date(data), "dd/MM/yy", { locale: ptBR })}
              <br />
              <span className="text-xs text-muted-foreground">
                {format(new Date(data), "HH:mm", { locale: ptBR })}
              </span>
            </span>
          )
        },
      },
      {
        id: 'cliente',
        header: 'Cliente',
        cell: ({ row }) => {
          return (
            <span className="text-sm">{row.original.clienteNome}</span>
          )
        },
      },
      {
        id: 'pacote',
        header: 'Pacote',
        cell: ({ row }) => {
          const nome = pacoteMap.get(row.original.pacoteId)
          return <span className="text-sm">{nome ?? row.original.pacoteId}</span>
        },
      },
      {
        accessorKey: 'localEnsaio',
        header: 'Local',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-32 truncate block">
            {row.original.localEnsaio}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} customLabels={statusLabels} />
        ),
      },
      {
        accessorKey: 'valorTotalFinal',
        header: 'Valor Total',
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums whitespace-nowrap">
            {formatCurrency(row.original.valorTotalFinal)}
          </span>
        ),
      },
      {
        id: 'pago',
        header: 'Pago',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums whitespace-nowrap">
            {formatCurrency(row.original.valorEntradaPago)}
          </span>
        ),
      },
      {
        id: 'editor',
        header: 'Editor',
        cell: ({ row }) => {
          const editorId = row.original.editorId
          const nome = editorId ? usuarioMap.get(editorId) : null
          return (
            <span className="text-sm text-muted-foreground">
              {nome ?? (editorId ? editorId : '---')}
            </span>
          )
        },
      },
    ],
    [pacoteMap, usuarioMap],
  )

  return (
    <DataTable
      columns={columns}
      data={agendamentos}
      isLoading={isLoading}
      enablePagination={false}
      enableFiltering={false}
      emptyMessage="Nenhum agendamento encontrado"
      renderActions={(row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.AGENDA_DETALHES.replace(':id', row.id))}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    />
  )
}
