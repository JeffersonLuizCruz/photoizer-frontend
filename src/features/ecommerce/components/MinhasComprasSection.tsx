import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Check, Clock, Upload, Download, Loader2, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import type { CompraExtraResponse, AdminCompraDetalheResponse } from '../types/ecommerce.types'
import { extractErrorMessage } from '@/shared/api'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface MinhasComprasSectionProps {
  token: string
}

export function MinhasComprasSection({ token }: MinhasComprasSectionProps) {
  const [compras, setCompras] = useState<CompraExtraResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detalheMap, setDetalheMap] = useState<Record<string, AdminCompraDetalheResponse>>({})
  const [comprovanteFiles, setComprovanteFiles] = useState<Record<string, File | null>>({})
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    ecommerceService.listarCompras(token)
      .then(setCompras)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [token])

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
      case 'PAGA': return <Check className="h-4 w-4 text-teal-500" />
      case 'AGUARDANDO_CONFIRMACAO': return <Clock className="h-4 w-4 text-orange-500" />
      case 'AGUARDANDO_COMPROVANTE': return <Upload className="h-4 w-4 text-amber-500" />
      case 'CANCELADA': return <X className="h-4 w-4 text-rose-400" />
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
    <div className="mt-6 border-t border-cyan-100 pt-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-cyan-950">Minhas Compras ({compras.length})</h2>
      <div className="space-y-2">
        {compras.map((compra) => {
          const isExpanded = expandedId === compra.id
          const detalhe = detalheMap[compra.id]
          const isSending = sendingIds.has(compra.id)

          return (
            <div key={compra.id} className="overflow-hidden rounded-2xl bg-white/95 shadow-sm ring-1 ring-cyan-100">
              <button onClick={() => toggleExpand(compra.id)}
                className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-cyan-50/60">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {statusIcon(compra.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{formatCurrency(compra.valorTotal)}</p>
                    <p className="text-[11px] text-slate-500">
                      {statusLabel(compra.status)}
                      {compra.metodoPagamento && ` · ${compra.metodoPagamento}`}
                      {compra.dataPagamento && ` · ${new Date(compra.dataPagamento).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-cyan-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-cyan-500" />}
              </button>

              {isExpanded && (
                <div className="space-y-3 border-t border-cyan-100 px-3 pb-3 pt-3">
                  {compra.status === 'CANCELADA' && compra.motivoRecusa && (
                    <div className="space-y-1 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Compra recusada
                      </div>
                      <p className="ml-5 text-rose-500">Motivo: {compra.motivoRecusa}</p>
                    </div>
                  )}

                  {compra.status === 'AGUARDANDO_COMPROVANTE' && (
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*,.pdf" className="text-xs flex-1"
                        onChange={(e) => setComprovanteFiles((prev) => ({ ...prev, [compra.id]: e.target.files?.[0] ?? null }))} />
                      <button onClick={() => enviarComprovante(compra.id)}
                        disabled={isSending || !comprovanteFiles[compra.id]}
                        className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-400 to-rose-400 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:from-orange-500 hover:to-rose-500 disabled:opacity-50">
                        {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Enviar
                      </button>
                    </div>
                  )}

                  {compra.status === 'AGUARDANDO_CONFIRMACAO' && (
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*,.pdf" className="text-xs flex-1"
                        onChange={(e) => setComprovanteFiles((prev) => ({ ...prev, [compra.id]: e.target.files?.[0] ?? null }))} />
                      <button onClick={() => enviarComprovante(compra.id)}
                        disabled={isSending || !comprovanteFiles[compra.id]}
                        className="flex items-center gap-1 rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-50 disabled:opacity-50">
                        {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Reenviar
                      </button>
                    </div>
                  )}

                  {detalhe && detalhe.fotos.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-2">Fotos ({detalhe.fotos.length})</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {detalhe.fotos.map((foto) => (
                          <div key={foto.id} className="overflow-hidden rounded-lg border border-cyan-100 bg-muted">
                            <div className="aspect-[3/2] bg-cover bg-center" style={{ backgroundImage: `url("${foto.thumbUrl}")` }} />
                            <div className="flex justify-center p-1">
                              {compra.status === 'PAGA' ? (
                                <a href={ecommerceService.downloadUrl(token, foto.id)}
                                  className="flex items-center gap-0.5 text-[10px] text-cyan-700 hover:underline">
                                  <Download className="h-3 w-3" />
                                  Download
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-500">Aguardando</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(compra.status === 'AGUARDANDO_CONFIRMACAO' || compra.status === 'PAGA') && (
                    <a href={ecommerceService.comprovanteUrl(token, compra.id)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-cyan-700 underline">
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
