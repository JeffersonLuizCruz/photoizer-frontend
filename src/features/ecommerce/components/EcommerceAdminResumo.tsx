import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Link2, Loader2, Check, X, ImagePlus, DollarSign, AlertTriangle, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { AdminLinkPagamentoDialog } from './AdminLinkPagamentoDialog'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { openProtected, extractErrorMessage } from '@/shared/api'
import { copyToClipboard } from '@/shared/lib/clipboard'
import { useState } from 'react'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function resolverLinkGaleria(linkGaleria: string | null, tokenGaleria: string | null): string | null {
  const candidato = linkGaleria?.trim() || (tokenGaleria ? `/g/${tokenGaleria}` : null)
  if (!candidato) return null
  try {
    return new URL(candidato, window.location.origin).toString()
  } catch {
    return null
  }
}

interface EcommerceAdminResumoProps {
  agendamentoId: string
}

export function EcommerceAdminResumo({ agendamentoId }: EcommerceAdminResumoProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [linkCompra, setLinkCompra] = useState<{ id: string; link: string | null } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ecommerce', agendamentoId],
    queryFn: () => ecommerceService.adminResumo(agendamentoId),
  })

  const { mutate: overrideSelecao } = useMutation({
    mutationFn: ({ fotoId, selecionada }: { fotoId: string; selecionada: boolean }) =>
      ecommerceService.adminOverrideSelecao(agendamentoId, fotoId, selecionada),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      toast.success('Seleção atualizada')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao atualizar seleção')),
  })

  const { mutate: regenToken, isPending: isRegenning } = useMutation({
    mutationFn: () => ecommerceService.adminRegenToken(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      setShowRegenConfirm(false)
      toast.success('Token regenerado! O link anterior não funciona mais.')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao regenerar token')),
  })

  const { mutate: confirmarCompra, isPending: isConfirming } = useMutation({
    mutationFn: (compraId: string) => ecommerceService.adminConfirmarCompra(compraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      toast.success('Pagamento confirmado! Fotos liberadas para download.')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao confirmar pagamento')),
  })

  const [confirmRecusarId, setConfirmRecusarId] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState('')

  const { mutate: recusarCompra, isPending: isRecusing } = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      ecommerceService.adminCancelarCompra(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      setConfirmRecusarId(null)
      setMotivoRecusa('')
      toast.success('Compra recusada!')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao recusar compra')),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImagePlus className="h-8 w-8 mb-2" />
        <p className="text-sm">Nenhum dado disponível</p>
      </div>
    )
  }

  const linkGaleria = resolverLinkGaleria(data.linkGaleria, data.tokenGaleria)

  const copiarLink = async () => {
    if (!linkGaleria) {
      toast.error('Link da galeria não disponível')
      return
    }
    try {
      await copyToClipboard(linkGaleria)
      toast.success('Link da galeria copiado!')
    } catch {
      toast.error('Não foi possível copiar o link. Copie manualmente o endereço exibido.')
    }
  }

  const totalCurtidas = Object.values(data.favoritosPorFoto ?? {}).reduce((acc, n) => acc + n, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={copiarLink}>
            <Link2 className="mr-1 h-4 w-4" />
            Copiar Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRegenConfirm(true)} disabled={isRegenning}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Regenerar Token
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos`)}>
            <ImagePlus className="mr-1 h-4 w-4" />
            Gerenciar Galeria
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}`)}>
            <DollarSign className="mr-1 h-4 w-4" />
            Ver Financeiro
          </Button>
        </div>
      </div>

      {linkGaleria && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
          <Link2 className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={linkGaleria}
            readOnly
            aria-label="Link público da galeria"
            className="min-w-0 flex-1 basis-full bg-background text-xs sm:basis-auto"
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold">{data.totalFotos}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="flex items-center gap-1 text-xs text-rose-600">
            <Heart className="h-3 w-3" fill="currentColor" /> Curtidas
          </p>
          <p className="text-lg font-bold text-rose-700">{totalCurtidas}</p>
        </div>
        <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3">
          <p className="text-xs text-emerald-600">Publicadas</p>
          <p className="text-lg font-bold text-emerald-700">{data.fotosPublicadas}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-3">
          <p className="text-xs text-blue-600">No Pacote</p>
          <p className="text-lg font-bold text-blue-700">{data.fotosSelecionadasPacote}</p>
        </div>
        <div className="rounded-lg border bg-violet-50 border-violet-200 p-3">
          <p className="text-xs text-violet-600">Pagas</p>
          <p className="text-lg font-bold text-violet-700">{data.fotosPagas}</p>
        </div>
        <div className="rounded-lg border bg-amber-50 border-amber-200 p-3">
          <p className="text-xs text-amber-600">Aguardando</p>
          <p className="text-lg font-bold text-amber-700">{data.fotosAguardando}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Valor Extras</p>
          <p className="text-lg font-bold">{formatCurrency(data.valorTotalExtras)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Fotos ({data.fotos.length})</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {data.fotos.map((foto) => (
            <div key={foto.id} className="group relative rounded-lg border bg-card overflow-hidden">
              <div className="aspect-[3/2] relative">
                <AuthImage src={foto.thumbUrl} alt={foto.fileName} className="h-full w-full object-cover" />
                {(data.favoritosPorFoto?.[foto.id] ?? 0) > 0 && (
                  <span className="absolute left-1 top-1 z-10 flex items-center gap-0.5 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    <Heart className="h-2.5 w-2.5" fill="currentColor" />
                    {data.favoritosPorFoto[foto.id]}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/25 md:bg-black/0 transition-colors flex items-center justify-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:bg-black/40 md:group-hover:opacity-100">
                  {foto.status === 'PUBLICADA' && !foto.compraExtraId && (
                    <button
                      onClick={() => overrideSelecao({ fotoId: foto.id, selecionada: !foto.selecionadaPacote })}
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${foto.selecionadaPacote ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      aria-label={foto.selecionadaPacote ? 'Remover do pacote' : 'Incluir no pacote'}
                    >
                      {foto.selecionadaPacote ? <X className="h-3 w-3 text-white" /> : <Check className="h-3 w-3 text-white" />}
                    </button>
                  )}
                  {foto.compraExtraId && foto.status === 'PUBLICADA' && (
                    <button
                      onClick={() => confirmarCompra(foto.compraExtraId!)}
                      disabled={isConfirming}
                      className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-600"
                      aria-label="Confirmar pagamento e liberar download"
                    >
                      <Check className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-1">
                <span className={`block text-[9px] font-medium px-1 py-0.5 rounded text-center ${
                  foto.status === 'PAGA' ? 'bg-violet-100 text-violet-700' :
                  foto.compraExtraId && foto.status === 'PUBLICADA' ? 'bg-amber-100 text-amber-700' :
                  foto.status === 'PUBLICADA' && foto.selecionadaPacote ? 'bg-blue-100 text-blue-700' :
                  foto.status === 'PUBLICADA' ? 'bg-emerald-100 text-emerald-700' :
                  foto.status === 'AGUARDANDO_CONFIRMACAO' ? 'bg-amber-100 text-amber-700' :
                  foto.status === 'AGUARDANDO_COMPROVANTE' ? 'bg-amber-100 text-amber-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {foto.status === 'PAGA' ? 'Paga' :
                   foto.compraExtraId && foto.status === 'PUBLICADA' ? 'Aguad. Pag.' :
                   foto.status === 'PUBLICADA' && foto.selecionadaPacote ? 'Selec.' :
                   foto.status === 'PUBLICADA' ? 'Pub.' :
                   foto.status === 'AGUARDANDO_CONFIRMACAO' ? 'Aguad. Conf.' :
                   foto.status === 'AGUARDANDO_COMPROVANTE' ? 'Aguad. Comp.' : foto.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.comprasExtras.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Compras de Extras</h3>
          <div className="hidden rounded-lg border overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-xs">ID</th>
                  <th className="text-right px-3 py-2 font-medium text-xs">Valor</th>
                  <th className="text-center px-3 py-2 font-medium text-xs">Status</th>
                  <th className="text-center px-3 py-2 font-medium text-xs">Data Pagamento</th>
                  <th className="text-center px-3 py-2 font-medium text-xs">Comprovante</th>
                  <th className="text-center px-3 py-2 font-medium text-xs">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.comprasExtras.map((compra) => (
                  <tr key={compra.id} className="border-b last:border-0">
                    <td className="px-3 py-2 text-xs font-mono">{compra.id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(compra.valorTotal)}</td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge status={compra.status === 'PAGA' ? 'paid' : compra.status === 'AGUARDANDO_CONFIRMACAO' ? 'warning' : compra.status === 'CANCELADA' ? 'cancelled' : 'inactive'}
                        customLabels={{
                          paid: { label: 'Pago', variant: 'success' },
                          warning: { label: 'Aguad. Confirmação', variant: 'warning' },
                          cancelled: { label: 'Cancelada', variant: 'secondary' },
                          inactive: { label: 'Aguad. Comprovante', variant: 'secondary' },
                        }} />
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                      {compra.dataPagamento ? new Date(compra.dataPagamento).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {compra.urlComprovante ? (
                        <button onClick={() => openProtected(compra.urlComprovante!)} className="text-primary underline text-xs">Ver</button>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
                          <button onClick={() => setLinkCompra({ id: compra.id, link: compra.linkPagamentoCartao })}
                            className="h-6 w-6 rounded hover:bg-cyan-100 hover:text-cyan-700 flex items-center justify-center"
                            title="Definir link de pagamento por cartão">
                            <Link2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO') && (
                          <>
                            <button onClick={() => confirmarCompra(compra.id)} disabled={isConfirming}
                              className="h-6 w-6 rounded hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center"
                              title="Confirmar pagamento">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setConfirmRecusarId(compra.id)} disabled={isRecusing}
                              className="h-6 w-6 rounded hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center"
                              title="Recusar compra">
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
            {data.comprasExtras.map((compra) => (
              <div key={compra.id} className="space-y-3 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">#{compra.id.slice(0, 8)}</p>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(compra.valorTotal)}</p>
                  </div>
                  <StatusBadge
                    status={compra.status === 'PAGA' ? 'paid' : compra.status === 'AGUARDANDO_CONFIRMACAO' ? 'warning' : compra.status === 'CANCELADA' ? 'cancelled' : 'inactive'}
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
                    <span className="min-w-0 break-words text-right">{compra.dataPagamento ? new Date(compra.dataPagamento).toLocaleDateString('pt-BR') : '—'}</span>
                  </div>
                  <div className="flex min-w-0 justify-between gap-2">
                    <span className="shrink-0 text-muted-foreground">Comprovante</span>
                    {compra.urlComprovante ? (
                      <button onClick={() => openProtected(compra.urlComprovante!)} className="text-primary underline">Ver</button>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
                {compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
                  <Button size="sm" variant="outline" onClick={() => setLinkCompra({ id: compra.id, link: compra.linkPagamentoCartao })} className="w-full">
                    <Link2 className="mr-1 h-4 w-4" /> Link de pagamento
                  </Button>
                )}
                {(compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO') && (
                  <div className="flex items-center gap-2 border-t pt-3">
                    <Button size="sm" onClick={() => confirmarCompra(compra.id)} disabled={isConfirming} className="flex-1">
                      <Check className="mr-1 h-4 w-4" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmRecusarId(compra.id)} disabled={isRecusing} className="flex-1">
                      <X className="mr-1 h-4 w-4" /> Recusar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showRegenConfirm}
        onOpenChange={setShowRegenConfirm}
        onConfirm={() => regenToken()}
        isLoading={isRegenning}
        title="Regenerar Token?"
        description="O link atual da galeria deixará de funcionar. Um novo link será gerado. Tem certeza?"
        confirmText="Regenerar"
        variant="default"
      />

      <AdminLinkPagamentoDialog
        compraId={linkCompra?.id ?? null}
        linkAtual={linkCompra?.link}
        open={linkCompra !== null}
        onOpenChange={(open) => { if (!open) setLinkCompra(null) }}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })}
      />

      <ConfirmDialog
        open={confirmRecusarId !== null}
        onOpenChange={(open) => { if (!open) { setConfirmRecusarId(null); setMotivoRecusa('') } }}
        onConfirm={() => confirmRecusarId && recusarCompra({ id: confirmRecusarId, motivo: motivoRecusa.trim() || undefined })}
        isLoading={isRecusing}
        title="Recusar Compra?"
        description="Esta ação cancelará a compra e desvinculará as fotos. Informe o motivo para o cliente ficar ciente."
        confirmText="Recusar Compra"
        variant="default">
        <div className="space-y-1">
          <label className="text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-muted-foreground" />
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
