import { useState } from 'react'
import { Package, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ecommerceService } from '../services/ecommerce.service'
import type { Pedido } from '../types/ecommerce.types'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { ROUTES } from '@/shared/constants'

const STATUS_PEDIDO = [
  'PENDENTE',
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'PROCESSANDO',
  'ENVIADO',
  'CONCLUIDO',
  'CANCELADO',
] as const

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_PAGAMENTO: 'Aguard. Pagamento',
  PAGO: 'Pago',
  PROCESSANDO: 'Processando',
  ENVIADO: 'Enviado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDENTE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  AGUARDANDO_PAGAMENTO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAGO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PROCESSANDO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ENVIADO: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  CONCLUIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELADO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface PedidosPageResponse {
  content: Pedido[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export function AdminPedidosPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-pedidos', page, statusFilter],
    queryFn: async () => {
      const response = await ecommerceService.adminListarPedidos({
        status: statusFilter,
        page: page + 1,
        perPage: 20,
      })
      return response as PedidosPageResponse
    },
  })

  const { mutate: atualizarStatus, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ecommerceService.adminAtualizarStatusPedido(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] })
      toast.success('Status atualizado!')
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar status'),
  })

  function exportCsv() {
    const pedidos = pageData?.content ?? []
    if (pedidos.length === 0) {
      toast.error('Nenhum pedido para exportar')
      return
    }
    const headers = ['ID', 'Cliente', 'Subtotal Pacote', 'Subtotal Extras', 'Taxa Entrega', 'Desconto', 'Total', 'Status', 'Forma Pagamento', 'Opção Entrega', 'Data Pedido', 'Data Conclusão']
    const rows = pedidos.map((p) => [
      p.id,
      p.clienteId,
      p.subtotalPacote,
      p.subtotalExtras,
      p.taxaEntrega,
      p.desconto,
      p.total,
      p.status,
      p.formaPagamento ?? '',
      p.opcaoEntrega ?? '',
      p.dataPedido ? new Date(p.dataPedido).toLocaleString('pt-BR') : '',
      p.dataConclusao ? new Date(p.dataConclusao).toLocaleString('pt-BR') : '',
    ])
    const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  const pedidos = pageData?.content ?? []
  const totalPages = pageData?.totalPages ?? 0

  return (
    <div>
      <PageTitle
        title="Pedidos"
        icon={<Package className="h-5 w-5" />}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Pedidos' },
        ]}
      />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between gap-2 flex-wrap">
          <select
            value={statusFilter ?? ''}
            onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(0) }}
            className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium"
          >
            <option value="">Todos os status</option>
            {STATUS_PEDIDO.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Forma Pagamento</th>
                  <th className="px-4 py-3 font-medium">Opção Entrega</th>
                  <th className="px-4 py-3 font-medium">Data Pedido</th>
                  <th className="px-4 py-3 font-medium">Alterar Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{pedido.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(pedido.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[pedido.status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {STATUS_LABELS[pedido.status] ?? pedido.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{pedido.formaPagamento ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{pedido.opcaoEntrega ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {pedido.dataPedido ? new Date(pedido.dataPedido).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={pedido.status}
                        disabled={isUpdating}
                        onChange={(e) => atualizarStatus({ id: pedido.id, status: e.target.value })}
                        className="rounded-lg border bg-background px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {STATUS_PEDIDO.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page + 1} de {Math.max(totalPages, 1)}
            {pageData ? ` — ${pageData.totalElements} pedido(s)` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
