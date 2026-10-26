import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Check, Clock, Upload, Download, Loader2, X, AlertTriangle, Copy, CreditCard, ExternalLink, QrCode, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import type { CompraExtraResponse, AdminCompraDetalheResponse, ConfiguracaoPagamentoResponse, ModoGaleria } from '../types/ecommerce.types'
import { extractErrorMessage } from '@/shared/api'
import { fotoThumbUrl, numeroGaleriaLabel, rotuloFoto } from '@/shared/lib/foto'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface MinhasComprasSectionProps {
  token: string
  modoGaleria: ModoGaleria
}

export function MinhasComprasSection({ token, modoGaleria }: MinhasComprasSectionProps) {
  const [compras, setCompras] = useState<CompraExtraResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detalheMap, setDetalheMap] = useState<Record<string, AdminCompraDetalheResponse>>({})
  const [comprovanteFiles, setComprovanteFiles] = useState<Record<string, File | null>>({})
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  const [pagamento, setPagamento] = useState<ConfiguracaoPagamentoResponse | null>(null)
  const [pixCopiado, setPixCopiado] = useState(false)

  const carregarCompras = useCallback(async () => {
    try {
      const [lista, configuracaoPagamento] = await Promise.all([
        ecommerceService.listarCompras(token),
        ecommerceService.obterPagamento().catch(() => null),
      ])
      setCompras(lista)
      setPagamento(configuracaoPagamento)
      // Mantém o detalhe expandido em dia (a edição sob demanda pode ser
      // liberada pelo estúdio enquanto o cliente está na tela).
      if (expandedId) {
        const detalhe = await ecommerceService.detalheCompra(token, expandedId)
        setDetalheMap((prev) => ({ ...prev, [expandedId]: detalhe }))
      }
    } catch {
      // Mantém o comportamento silencioso: a seção some se a galeria expirar.
    } finally {
      setIsLoading(false)
    }
  }, [token, expandedId])

  useEffect(() => {
    void carregarCompras()
  }, [carregarCompras])

  // Enquanto houver compra paga, verifica periodicamente se a edição sob
  // demanda foi liberada (o download passa a aparecer sem recarregar a página).
  useEffect(() => {
    if (!compras.some((compra) => compra.status === 'PAGA')) return
    const interval = setInterval(() => { void carregarCompras() }, 30_000)
    return () => clearInterval(interval)
  }, [compras, carregarCompras])

  useEffect(() => {
    // PIX pode ter a chave corrigida pelo staff enquanto a compra está
    // pendente; o polling mantém a chave exibida sempre atual.
    const temPagamentoPendente = compras.some((c) =>
      (c.metodoPagamento === 'CARTAO' || c.metodoPagamento === 'PIX')
      && c.status !== 'PAGA'
      && c.status !== 'CANCELADA')
    if (!temPagamentoPendente) return
    const interval = setInterval(carregarCompras, 20000)
    return () => clearInterval(interval)
  }, [carregarCompras, compras])

  const toggleExpand = async (compraId: string) => {
    if (expandedId === compraId) {
      setExpandedId(null)
      return
    }
    setExpandedId(compraId)
    if (!detalheMap[compraId]) {
      try {
        const detalhe = await ecommerceService.detalheCompra(token, compraId)
        setDetalheMap((prev) => ({ ...prev, [compraId]: detalhe }))
      } catch {
        toast.error('Erro ao carregar detalhes da compra')
      }
    }
  }

  const copiarPix = () => {
    if (!pagamento?.pixChave) return
    navigator.clipboard.writeText(pagamento.pixChave)
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 2000)
    toast.success('Chave PIX copiada!')
  }

  const enviarComprovante = async (compraId: string) => {
    const file = comprovanteFiles[compraId]
    if (!file) return
    setSendingIds((prev) => new Set(prev).add(compraId))
    try {
      await ecommerceService.uploadComprovante(token, compraId, file)
      setCompras((prev) => prev.map((c) => c.id === compraId ? { ...c, status: 'AGUARDANDO_CONFIRMACAO' } : c))
      setComprovanteFiles((prev) => { const next = { ...prev }; delete next[compraId]; return next })
      toast.success('Comprovante enviado!')
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao enviar comprovante'))
    } finally {
      setSendingIds((prev) => { const next = new Set(prev); next.delete(compraId); return next })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (compras.length === 0) return null

  function statusIcon(status: string) {
    switch (status) {
      case 'PAGA': return <Check className="h-4 w-4 text-gallery-accent" />
      case 'AGUARDANDO_CONFIRMACAO': return <Clock className="h-4 w-4 text-gallery-accent" />
      case 'AGUARDANDO_COMPROVANTE': return <Upload className="h-4 w-4 text-gallery-accent" />
      case 'CANCELADA': return <X className="h-4 w-4 text-gallery-muted" />
      default: return null
    }
  }

  function statusLabel(status: string) {
    switch (status) {
      case 'PAGA': return 'Pago'
      case 'AGUARDANDO_CONFIRMACAO': return 'Aguardando confirmação'
      case 'AGUARDANDO_COMPROVANTE': return 'Aguardando comprovante'
      case 'CANCELADA': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="mt-6 border-t border-gallery-line pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-gallery-ink sm:text-lg">Minhas Compras ({compras.length})</h2>
        <button onClick={carregarCompras}
          className="flex min-h-11 items-center gap-1 rounded-lg border border-gallery-line px-3 text-xs font-medium text-gallery-accent transition-colors hover:bg-gallery-line/40"
          title="Atualizar compras">
          <RefreshCw className="h-3 w-3" />
          Atualizar
        </button>
      </div>
      <div className="space-y-2">
        {compras.map((compra) => {
          const isExpanded = expandedId === compra.id
          const detalhe = detalheMap[compra.id]
          const isSending = sendingIds.has(compra.id)

          return (
            <div key={compra.id} className="overflow-hidden rounded-2xl bg-gallery-surface shadow-sm ring-1 ring-gallery-line">
              <button onClick={() => toggleExpand(compra.id)}
                className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-gallery-line/40/60">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {statusIcon(compra.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gallery-ink">{formatCurrency(compra.valorTotal)}</p>
                    <p className="text-[11px] text-gallery-muted">
                      {statusLabel(compra.status)}
                      {compra.metodoPagamento && ` · ${compra.metodoPagamento}`}
                      {compra.dataPagamento && ` · ${new Date(compra.dataPagamento).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-gallery-accent" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gallery-accent" />}
              </button>

              {isExpanded && (
                <div className="space-y-3 border-t border-gallery-line px-3 pb-3 pt-3">
                  {compra.status === 'CANCELADA' && compra.motivoRecusa && (
                    <div className="space-y-1 rounded-2xl border border-gallery-line bg-gallery-bg p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-gallery-accent">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Compra recusada
                      </div>
                      <p className="ml-5 text-gallery-muted">Motivo: {compra.motivoRecusa}</p>
                    </div>
                  )}

                  {compra.metodoPagamento === 'PIX'
                    && (compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO') && (
                      <div className="space-y-2 rounded-2xl border border-gallery-line bg-gallery-bg p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gallery-ink">
                          <QrCode className="h-3.5 w-3.5" />
                          Pague via PIX
                        </div>
                        {pagamento?.pixChave ? (
                          <>
                            <p className="break-all text-[11px] text-gallery-muted">
                              {pagamento.pixTipoChave ? `${pagamento.pixTipoChave}: ` : ''}
                              <span className="font-mono text-gallery-ink">{pagamento.pixChave}</span>
                            </p>
                            <button
                              onClick={copiarPix}
                              className="flex items-center gap-1 text-xs font-medium text-gallery-accent hover:opacity-80"
                            >
                              {pixCopiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {pixCopiado ? 'Copiado' : 'Copiar chave'}
                            </button>
                          </>
                        ) : (
                          <p className="text-[11px] text-gallery-accent">
                            O estúdio ainda não configurou o PIX. Use &quot;Atualizar&quot; para verificar.
                          </p>
                        )}
                        <p className="text-[11px] text-gallery-muted">
                          Valor: <span className="font-medium text-gallery-ink">{formatCurrency(compra.valorTotal)}</span>
                        </p>
                      </div>
                    )}

                  {(compra.metodoPagamento === 'CARTAO' || compra.linkPagamentoCartao) && compra.status !== 'PAGA' && compra.status !== 'CANCELADA' && (
                    <div className="space-y-2 rounded-2xl border border-gallery-line bg-gallery-bg p-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gallery-ink">
                        <CreditCard className="h-3.5 w-3.5" />
                        Pagamento com cartão
                      </div>
                      {compra.linkPagamentoCartao ? (
                        <a href={compra.linkPagamentoCartao} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-gallery-ink px-3 py-2 text-xs font-semibold text-gallery-bg transition-opacity hover:opacity-90">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Pagar com cartão de crédito
                        </a>
                      ) : (
                        <p className="text-[11px] text-gallery-muted">
                          Aguardando o estúdio gerar o link de pagamento. Use &quot;Atualizar&quot; para verificar.
                        </p>
                      )}
                    </div>
                  )}

                  {compra.status === 'AGUARDANDO_COMPROVANTE' && compra.metodoPagamento !== 'CARTAO' && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input type="file" accept="image/*,.pdf" capture="environment" className="w-full min-w-0 flex-1 text-xs"
                        onChange={(e) => setComprovanteFiles((prev) => ({ ...prev, [compra.id]: e.target.files?.[0] ?? null }))} />
                      <button onClick={() => enviarComprovante(compra.id)}
                        disabled={isSending || !comprovanteFiles[compra.id]}
                        className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg bg-gallery-ink text-gallery-bg hover:opacity-90 sm:w-auto">
                        {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Enviar
                      </button>
                    </div>
                  )}

                  {compra.status === 'AGUARDANDO_CONFIRMACAO' && compra.metodoPagamento !== 'CARTAO' && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input type="file" accept="image/*,.pdf" capture="environment" className="w-full min-w-0 flex-1 text-xs"
                        onChange={(e) => setComprovanteFiles((prev) => ({ ...prev, [compra.id]: e.target.files?.[0] ?? null }))} />
                      <button onClick={() => enviarComprovante(compra.id)}
                        disabled={isSending || !comprovanteFiles[compra.id]}
                        className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-gallery-line px-3 text-xs font-medium text-gallery-accent transition-colors hover:bg-gallery-line/40 disabled:opacity-50 sm:w-auto">
                        {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Reenviar
                      </button>
                    </div>
                  )}

                  {detalhe && detalhe.fotos.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-2">Fotos ({detalhe.fotos.length})</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                        {detalhe.fotos.map((foto) => (
                          <div key={foto.id} className="overflow-hidden rounded-lg border border-gallery-line bg-muted">
                            <div className="relative aspect-[3/2] bg-cover bg-center" style={{ backgroundImage: `url("${fotoThumbUrl(foto)}")` }} title={rotuloFoto(foto)}>
                              {foto.numeroGaleria != null && (
                                <span className="absolute left-1 top-1 rounded bg-slate-950/70 px-1 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur">
                                  {numeroGaleriaLabel(foto.numeroGaleria)}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-center p-1">
                              {compra.status === 'PAGA' ? (
                                modoGaleria === 'COM_EDICAO' && foto.versaoAtual !== 'EDITADA' ? (
                                  <span className="flex min-h-11 items-center gap-0.5 px-2 text-[11px] text-gallery-muted">
                                    <Clock className="h-3 w-3" />
                                    Aguardando edição
                                  </span>
                                ) : (
                                  <a href={ecommerceService.downloadUrl(token, foto.id)}
                                    className="flex min-h-11 items-center gap-0.5 px-2 text-[11px] text-gallery-accent hover:underline">
                                    <Download className="h-3 w-3" />
                                    Download
                                  </a>
                                )
                              ) : (
                                <span className="py-1.5 text-[11px] text-gallery-muted">Aguardando</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {modoGaleria === 'COM_EDICAO'
                        && detalhe.fotos.some((foto) => foto.versaoAtual !== 'EDITADA') && (
                          <p className="mt-2 text-[11px] leading-relaxed text-gallery-muted">
                            As fotos marcadas como “Aguardando edição” serão liberadas para download
                            assim que o estúdio publicar a versão editada.
                          </p>
                        )}
                    </div>
                  )}

                  {(compra.status === 'AGUARDANDO_CONFIRMACAO' || compra.status === 'PAGA') && (
                    <a href={ecommerceService.comprovanteUrl(token, compra.id)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gallery-accent underline">
                      <Download className="h-3 w-3" />
                      Ver comprovante
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
