import { useState, useCallback } from 'react'
import { ShoppingCart, Check, X, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ecommerceService } from '../services/ecommerce.service'
import type { CompraExtraResponse } from '../types/ecommerce.types'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { DataTable } from '@/shared/components/layout/DataTable'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { AdminCompraDetalheDialog } from '../components/AdminCompraDetalheDialog'
import type { ColumnDef } from '@tanstack/react-table'
import { ROUTES } from '@/shared/constants'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function statusBadge(status: string) {
  if (status === 'PAGA') return { variant: 'success' as const, label: 'Pago' }
  if (status === 'AGUARDANDO_CONFIRMACAO') return { variant: 'warning' as const, label: 'Aguad. Confirmação' }
  if (status === 'AGUARDANDO_COMPROVANTE') return { variant: 'secondary' as const, label: 'Aguad. Comprovante' }
  if (status === 'CANCELADA') return { variant: 'destructive' as const, label: 'Cancelada' }
  return { variant: 'secondary' as const, label: status }
}

export function AdminEcommercePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [detailCompraId, setDetailCompraId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-compras', page, perPage, statusFilter],
    queryFn: async () => {
      const response = await ecommerceService.adminListarCompras({
        status: statusFilter,
        page: page + 1,
        perPage,
      })
      return response as {
        content: CompraExtraResponse[]
        totalElements: number
        totalPages: number
        number: number
        size: number
      }
    },
  })

  const { data: relatorio } = useQuery({
    queryKey: ['admin-compras-relatorio'],
    queryFn: () => ecommerceService.adminRelatorioCompras(),
  })

  const { mutate: confirmar, isPending: isConfirming } = useMutation({
    mutationFn: (id: string) => ecommerceService.adminConfirmarCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-compras'] })
      queryClient.invalidateQueries({ queryKey: ['admin-compras-relatorio'] })
      toast.success('Pagamento confirmado!')
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao confirmar'),
  })

  const { mutate: cancelar, isPending: isCancelling } = useMutation({
    mutationFn: (id: string) => ecommerceService.adminCancelarCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-compras'] })
      queryClient.invalidateQueries({ queryKey: ['admin-compras-relatorio'] })
      setConfirmCancelId(null)
      toast.success('Compra cancelada!')
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao cancelar'),
  })

  const columns: ColumnDef<CompraExtraResponse>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id.slice(0, 8)}</span>,
    },
    {
      accessorKey: 'valorTotal',
      header: 'Valor',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.valorTotal)}</span>,
    },
    {
      accessorKey: 'quantidadeFotos',
      header: 'Fotos',
      cell: ({ row }) => <span>{row.original.quantidadeFotos ?? '-'}</span>,
    },
    {
      accessorKey: 'metodoPagamento',
      header: 'Pagamento',
      cell: ({ row }) => <span>{row.original.metodoPagamento ?? '-'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = statusBadge(row.original.status)
        return <StatusBadge variant={s.variant} customLabels={{ [s.variant]: { label: s.label, variant: s.variant } }} />
      },
    },
    {
      accessorKey: 'dataPagamento',
      header: 'Data',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.dataPagamento ? new Date(row.original.dataPagamento).toLocaleDateString('pt-BR') : '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const compra = row.original
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => setDetailCompraId(compra.id)}
              className="h-7 w-7 rounded hover:bg-accent flex items-center justify-center" title="Detalhes">
              <Eye className="h-3.5 w-3.5" />
            </button>
            {(compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO') && (
              <button onClick={() => confirmar(compra.id)} disabled={isConfirming}
                className="h-7 w-7 rounded hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 flex items-center justify-center"
                title="Confirmar pagamento">
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
            {compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
              <button onClick={() => setConfirmCancelId(compra.id)} disabled={isCancelling}
                className="h-7 w-7 rounded hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                title="Cancelar">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageTitle
        title="Pedidos - Ecommerce"
        icon={<ShoppingCart className="h-5 w-5" />}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Ecommerce' },
        ]}
      />

      {relatorio && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{relatorio.totalCompras}</p>
          </div>
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">Aguad. Comp.</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{relatorio.aguardandoComprovante}</p>
          </div>
          <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 p-3">
            <p className="text-xs text-orange-600 dark:text-orange-400">Aguad. Conf.</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{relatorio.aguardandoConfirmacao}</p>
          </div>
          <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-3">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Pagas</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{relatorio.pagas}</p>
          </div>
          <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-3">
            <p className="text-xs text-red-600 dark:text-red-400">Canceladas</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{relatorio.canceladas}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Faturado</p>
            <p className="text-lg font-bold">{formatCurrency(relatorio.totalFaturado)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">A Receber</p>
            <p className="text-lg font-bold">{formatCurrency(relatorio.totalAguardando)}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center gap-2">
          <select
            value={statusFilter ?? ''}
            onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(0) }}
            className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium">
            <option value="">Todos os status</option>
            <option value="AGUARDANDO_COMPROVANTE">Aguardando Comprovante</option>
            <option value="AGUARDANDO_CONFIRMACAO">Aguardando Confirmação</option>
            <option value="PAGA">Paga</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
        <DataTable
          columns={columns}
          data={pageData?.content ?? []}
          isLoading={isLoading}
          pageCount={pageData?.totalPages ?? 0}
          pageIndex={page}
          pageSize={perPage}
          onPageChange={setPage}
          onPageSizeChange={setPerPage}
          emptyMessage="Nenhuma compra encontrada" />
      </div>

      <AdminCompraDetalheDialog
        compraId={detailCompraId}
        open={detailCompraId !== null}
        onOpenChange={(open) => { if (!open) setDetailCompraId(null) }} />

      <ConfirmDialog
        open={confirmCancelId !== null}
        onOpenChange={(open) => { if (!open) setConfirmCancelId(null) }}
        onConfirm={() => confirmCancelId && cancelar(confirmCancelId)}
        isLoading={isCancelling}
        title="Cancelar Compra?"
        description="Tem certeza que deseja cancelar esta compra? As fotos serão desvinculadas."
        confirmText="Cancelar Compra"
        variant="destructive" />
    </div>
  )
}
