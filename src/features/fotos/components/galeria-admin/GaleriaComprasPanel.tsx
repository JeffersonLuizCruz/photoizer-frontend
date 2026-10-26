import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Link2, Loader2, ShoppingBag, X } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import { AdminLinkPagamentoDialog } from '@/features/ecommerce/components/AdminLinkPagamentoDialog'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { extractErrorMessage, openProtected } from '@/shared/api'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function GaleriaComprasPanel({ agendamentoId }: { agendamentoId: string }) {
  const queryClient = useQueryClient()
  const [linkCompra, setLinkCompra] = useState<{ id: string; link: string | null } | null>(null)
  const [confirmRecusarId, setConfirmRecusarId] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-ecommerce', agendamentoId],
    queryFn: () => ecommerceService.adminResumo(agendamentoId),
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
    queryClient.invalidateQueries({ queryKey: ['fotos', agendamentoId] })
    queryClient.invalidateQueries({ queryKey: ['selecoes-ensaio', agendamentoId] })
  }

  const { mutate: confirmarCompra, isPending: isConfirming } = useMutation({
    mutationFn: (compraId: string) => ecommerceService.adminConfirmarCompra(compraId),
    onSuccess: () => {
      invalidar()
      toast.success('Pagamento confirmado! Fotos liberadas para download.')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao confirmar pagamento')),
  })

  const { mutate: recusarCompra, isPending: isRecusing } = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      ecommerceService.adminCancelarCompra(id, motivo),
    onSuccess: () => {
      invalidar()
      setConfirmRecusarId(null)
      setMotivoRecusa('')
      toast.success('Compra recusada!')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao recusar compra')),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-16 text-center">
        <AlertTriangle className="mb-2 h-8 w-8 text-amber-600" />
        <p className="text-sm font-medium">Não foi possível carregar as compras</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {extractErrorMessage(error, 'Tente novamente em instantes.')}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  const compras = data?.comprasExtras ?? []
  const pendentes = compras.filter(
    (compra) => compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO',
  ).length
  const pagas = compras.filter((compra) => compra.status === 'PAGA').length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Valor em extras</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(data?.valorTotalExtras ?? 0)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Compras</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{compras.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-700">Pendentes</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{pendentes}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-700">Pagas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{pagas}</p>
        </div>
      </div>

      {compras.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center text-muted-foreground">
          <ShoppingBag className="mb-2 h-8 w-8" />
          <p className="text-sm font-medium">Nenhuma compra de extra ainda</p>
          <p className="mt-1 text-xs">As compras aparecem aqui quando o cliente finalizar o carrinho da galeria.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium">ID</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">Valor</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">Status</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">Pagamento</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">Comprovante</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{compra.id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(compra.valorTotal)}</td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge
                        status={
                          compra.status === 'PAGA'
                            ? 'paid'
                            : compra.status === 'AGUARDANDO_CONFIRMACAO'
                              ? 'warning'
                              : compra.status === 'CANCELADA'
                                ? 'cancelled'
                                : 'inactive'
                        }
                        customLabels={{
                          paid: { label: 'Pago', variant: 'success' },
                          warning: { label: 'Aguad. Confirmação', variant: 'warning' },
                          cancelled: { label: 'Cancelada', variant: 'secondary' },
                          inactive: { label: 'Aguad. Comprovante', variant: 'secondary' },
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                      {compra.dataPagamento
                        ? new Date(compra.dataPagamento).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {compra.urlComprovante ? (
                        <button
                          onClick={() => openProtected(compra.urlComprovante!)}
                          aria-label={`Ver comprovante da compra ${compra.id.slice(0, 8)}`}
                          className="rounded text-xs text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          Ver
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
                          <button
                            onClick={() => setLinkCompra({ id: compra.id, link: compra.linkPagamentoCartao })}
                            className="flex h-6 w-6 items-center justify-center rounded hover:bg-cyan-100 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            title="Definir link de pagamento por cartão"
                            aria-label={`Definir link de pagamento da compra ${compra.id.slice(0, 8)}`}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(compra.status === 'AGUARDANDO_COMPROVANTE'
                          || compra.status === 'AGUARDANDO_CONFIRMACAO') && (
                          <>
                            <button
                              onClick={() => confirmarCompra(compra.id)}
                              disabled={isConfirming}
                              className="flex h-6 w-6 items-center justify-center rounded hover:bg-emerald-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              title="Confirmar pagamento"
                              aria-label={`Confirmar pagamento da compra ${compra.id.slice(0, 8)}`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmRecusarId(compra.id)}
                              disabled={isRecusing}
                              className="flex h-6 w-6 items-center justify-center rounded hover:bg-rose-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              title="Recusar compra"
                              aria-label={`Recusar compra ${compra.id.slice(0, 8)}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {compras.map((compra) => (
              <div key={compra.id} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">#{compra.id.slice(0, 8)}</p>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(compra.valorTotal)}</p>
                  </div>
                  <StatusBadge
                    status={
                      compra.status === 'PAGA'
                        ? 'paid'
                        : compra.status === 'AGUARDANDO_CONFIRMACAO'
                          ? 'warning'
                          : compra.status === 'CANCELADA'
                            ? 'cancelled'
                            : 'inactive'
                    }
                    customLabels={{
                      paid: { label: 'Pago', variant: 'success' },
                      warning: { label: 'Aguad. Confirmação', variant: 'warning' },
                      cancelled: { label: 'Cancelada', variant: 'secondary' },
                      inactive: { label: 'Aguad. Comprovante', variant: 'secondary' },
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex min-w-0 justify-between gap-2">
                    <span className="shrink-0 text-muted-foreground">Data</span>
                    <span className="min-w-0 break-words text-right">
                      {compra.dataPagamento
                        ? new Date(compra.dataPagamento).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex min-w-0 justify-between gap-2">
                    <span className="shrink-0 text-muted-foreground">Comprovante</span>
                    {compra.urlComprovante ? (
                      <button onClick={() => openProtected(compra.urlComprovante!)} className="text-primary underline">
                        Ver
                      </button>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
                {compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLinkCompra({ id: compra.id, link: compra.linkPagamentoCartao })}
                    className="w-full"
                  >
                    <Link2 className="mr-1 h-4 w-4" />
                    Link de pagamento
                  </Button>
                )}
                {(compra.status === 'AGUARDANDO_COMPROVANTE'
                  || compra.status === 'AGUARDANDO_CONFIRMACAO') && (
                  <div className="flex items-center gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      onClick={() => confirmarCompra(compra.id)}
                      disabled={isConfirming}
                      className="flex-1"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmRecusarId(compra.id)}
                      disabled={isRecusing}
                      className="flex-1"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Recusar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <AdminLinkPagamentoDialog
        compraId={linkCompra?.id ?? null}
        linkAtual={linkCompra?.link}
        open={linkCompra !== null}
        onOpenChange={(open) => { if (!open) setLinkCompra(null) }}
        onSaved={invalidar}
      />

      <ConfirmDialog
        open={confirmRecusarId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRecusarId(null)
            setMotivoRecusa('')
          }
        }}
        onConfirm={() =>
          confirmRecusarId
            ? recusarCompra({ id: confirmRecusarId, motivo: motivoRecusa.trim() || undefined })
            : undefined
        }
        isLoading={isRecusing}
        title="Recusar Compra?"
        description="Esta ação cancelará a compra e desvinculará as fotos. Informe o motivo para o cliente ficar ciente."
        confirmText="Recusar Compra"
        variant="default"
      >
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs font-medium">
            Motivo da recusa <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            value={motivoRecusa}
            onChange={(event) => setMotivoRecusa(event.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex.: Comprovante ilegível, valor divergente..."
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
