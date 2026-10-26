import { useState } from 'react'
import { Check, X, Eye, AlertTriangle, Link2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ecommerceService } from '../services/ecommerce.service'
import type { CompraExtraResponse } from '../types/ecommerce.types'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { DataTable } from '@/shared/components/layout/DataTable'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { AdminCompraDetalheDialog } from '../components/AdminCompraDetalheDialog'
import { AdminLinkPagamentoDialog } from '../components/AdminLinkPagamentoDialog'
import { AdminPagamentoConfigDialog } from '../components/AdminPagamentoConfigDialog'
import type { ColumnDef } from '@tanstack/react-table'
import { QUERY_KEYS, ROUTES } from '@/shared/constants'
import { extractErrorMessage } from '@/shared/api'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/shared/components/ui/button'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function statusBadge(status: string) {
  if (status === 'PAGA') return { variant: 'success' as const, label: 'Pago' }
  if (status === 'AGUARDANDO_CONFIRMACAO') return { variant: 'warning' as const, label: 'Aguad. Confirmação' }
  if (status === 'AGUARDANDO_COMPROVANTE') return { variant: 'secondary' as const, label: 'Aguad. Comprovante' }
  if (status === 'CANCELADA') return { variant: 'secondary' as const, label: 'Cancelada' }
  return { variant: 'secondary' as const, label: status }
}

export function AdminEcommercePage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  // A chave PIX do e-commerce é global e somente ADMIN pode alterá-la.
  // O link de pagamento por cartão de cada compra continua com ADMIN/FOTOGRAFO.
  const podeConfigurarPix = user?.papel === 'ADMIN'
  const podeGerenciarPagamento = user?.papel === 'ADMIN' || user?.papel === 'FOTOGRAFO'
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [detailCompraId, setDetailCompraId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [showConfigPagamento, setShowConfigPagamento] = useState(false)
  const [linkCompra, setLinkCompra] = useState<CompraExtraResponse | null>(null)

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-compras', page, perPage, statusFilter],
    queryFn: () => ecommerceService.adminListarCompras({
      status: statusFilter,
      page: page + 1,
      perPage,
    }),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Pagamento confirmado!')
    },
    onError: (err: Error) => toast.error(extractErrorMessage(err, 'Erro ao confirmar')),
  })

  const { mutate: cancelar, isPending: isCancelling } = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) => ecommerceService.adminCancelarCompra(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-compras'] })
      queryClient.invalidateQueries({ queryKey: ['admin-compras-relatorio'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AGENDA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCEIRO })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      setConfirmCancelId(null)
      setMotivoRecusa('')
      toast.success('Compra cancelada!')
    },
    onError: (err: Error) => toast.error(extractErrorMessage(err, 'Erro ao cancelar')),
  })

  const renderAcoes = (compra: CompraExtraResponse) => (
    <div className="flex items-center gap-1">
      <button onClick={() => setDetailCompraId(compra.id)}
        className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-accent" aria-label="Ver detalhes">
        <Eye className="h-4 w-4" />
      </button>
      {podeGerenciarPagamento && compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
        <button onClick={() => setLinkCompra(compra)}
          className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-accent"
          aria-label="Definir link de pagamento por cartão">
          <Link2 className="h-4 w-4" />
        </button>
      )}
      {(compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO') && (
        <button onClick={() => confirmar(compra.id)} disabled={isConfirming}
          className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-emerald-100 hover:text-emerald-700"
          aria-label="Confirmar pagamento">
          <Check className="h-4 w-4" />
        </button>
      )}
      {compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
        <button onClick={() => setConfirmCancelId(compra.id)} disabled={isCancelling}
          className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive"
          aria-label="Cancelar compra">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )

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
        return (
          <StatusBadge
            status={row.original.status}
            customLabels={{ [row.original.status]: { label: s.label, variant: s.variant } }}
          />
        )
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
      cell: ({ row }) => renderAcoes(row.original),
    },
  ]

  return (
    <div>
      <PageTitle
        title="Pedidos - Ecommerce"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Ecommerce' },
        ]}
        actions={podeConfigurarPix ? (
          <Button variant="outline" size="sm" onClick={() => setShowConfigPagamento(true)}>
            <Settings className="mr-1 h-4 w-4" />
            Configurar PIX
          </Button>
        ) : undefined}
      />

      {relatorio && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{relatorio.totalCompras}</p>
          </div>
          <div className="rounded-lg border bg-amber-50 border-amber-200 p-3">
            <p className="text-xs text-amber-600">Aguad. Comp.</p>
            <p className="text-lg font-bold text-amber-700">{relatorio.aguardandoComprovante}</p>
          </div>
          <div className="rounded-lg border bg-orange-50 border-orange-200 p-3">
            <p className="text-xs text-orange-600">Aguad. Conf.</p>
            <p className="text-lg font-bold text-orange-700">{relatorio.aguardandoConfirmacao}</p>
          </div>
          <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3">
            <p className="text-xs text-emerald-600">Pagas</p>
            <p className="text-lg font-bold text-emerald-700">{relatorio.pagas}</p>
          </div>
          <div className="rounded-lg border bg-rose-50 border-rose-200 p-3">
            <p className="text-xs text-rose-500">Canceladas</p>
            <p className="text-lg font-bold text-rose-600">{relatorio.canceladas}</p>
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
          data={pageData?.data ?? []}
          isLoading={isLoading}
          pageCount={pageData?.totalPages ?? 0}
          pageIndex={page}
          pageSize={perPage}
          onPageChange={setPage}
          onPageSizeChange={setPerPage}
          emptyMessage="Nenhuma compra encontrada"
          minWidthClassName="min-w-[640px]"
          renderMobileCard={(compra) => (
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">#{compra.id.slice(0, 8)}</p>
                  <p className="text-lg font-semibold tabular-nums">{formatCurrency(compra.valorTotal)}</p>
                </div>
                <StatusBadge
                  status={compra.status}
                  customLabels={{ [compra.status]: statusBadge(compra.status) }}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Fotos</span>
                  <span>{compra.quantidadeFotos ?? '-'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span>{compra.metodoPagamento ?? '-'}</span>
                </div>
                <div className="col-span-2 flex justify-between gap-2">
                  <span className="text-muted-foreground">Data</span>
                  <span>
                    {compra.dataPagamento ? new Date(compra.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">{renderAcoes(compra)}</div>
            </div>
          )} />
      </div>

      <AdminCompraDetalheDialog
        compraId={detailCompraId}
        open={detailCompraId !== null}
        onOpenChange={(open) => { if (!open) setDetailCompraId(null) }} />

      <AdminPagamentoConfigDialog
        open={showConfigPagamento}
        onOpenChange={setShowConfigPagamento}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['config-pagamento-ecommerce'] })}
      />

      <AdminLinkPagamentoDialog
        compraId={linkCompra?.id ?? null}
        linkAtual={linkCompra?.linkPagamentoCartao}
        open={linkCompra !== null}
        onOpenChange={(open) => { if (!open) setLinkCompra(null) }}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-compras'] })
          queryClient.invalidateQueries({ queryKey: ['admin-compras-relatorio'] })
        }}
      />

      <ConfirmDialog
        open={confirmCancelId !== null}
        onOpenChange={(open) => { if (!open) { setConfirmCancelId(null); setMotivoRecusa('') } }}
        onConfirm={() => confirmCancelId && cancelar({ id: confirmCancelId, motivo: motivoRecusa.trim() || undefined })}
        isLoading={isCancelling}
        title="Recusar Compra?"
        description="Esta ação cancelará a compra e desvinculará as fotos. Informe o motivo para o cliente ficar ciente."
        confirmText="Recusar Compra"
        variant="default">
        <div className="space-y-1">
          <label className="text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            Motivo da recusa <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            value={motivoRecusa}
            onChange={(e) => setMotivoRecusa(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Ex.: Comprovante ilegível, valor divergente..."
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
