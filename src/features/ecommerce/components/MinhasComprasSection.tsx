import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Check, Clock, Upload, Download, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import type { CompraExtraResponse, AdminCompraDetalheResponse } from '../types/ecommerce.types'

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
  const [comprovanteFiles, setComprovanteFiles] = useState<Record<string, File>>({})
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar comprovante')
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
      case 'PAGA': return <Check className="h-4 w-4 text-emerald-500" />
      case 'AGUARDANDO_CONFIRMACAO': return <Clock className="h-4 w-4 text-orange-500" />
      case 'AGUARDANDO_COMPROVANTE': return <Upload className="h-4 w-4 text-amber-500" />
      case 'CANCELADA': return <XCircle className="h-4 w-4 text-red-500" />
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
    <div className="border-t pt-6 mt-6">
      <h2 className="text-sm font-semibold mb-4">Minhas Compras ({compras.length})</h2>
      <div className="space-y-2">
        {compras.map((compra) => {
          const isExpanded = expandedId === compra.id
          const detalhe = detalheMap[compra.id]
          const isSending = sendingIds.has(compra.id)

          return (
            <div key={compra.id} className="rounded-lg border bg-card overflow-hidden">
              <button onClick={() => toggleExpand(compra.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors text-left">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {statusIcon(compra.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{formatCurrency(compra.valorTotal)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {statusLabel(compra.status)}
                      {compra.metodoPagamento && ` · ${compra.metodoPagamento}`}
                      {compra.dataPagamento && ` · ${new Date(compra.dataPagamento).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t pt-3 space-y-3">
                  {compra.status === 'AGUARDANDO_COMPROVANTE' && (
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*,.pdf" className="text-xs flex-1"
                        onChange={(e) => setComprovanteFiles((prev) => ({ ...prev, [compra.id]: e.target.files?.[0] ?? null }))} />
                      <button onClick={() => enviarComprovante(compra.id)}
                        disabled={isSending || !comprovanteFiles[compra.id]}
                        className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1">
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
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-1">
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
                          <div key={foto.id} className="rounded border bg-muted overflow-hidden">
                            <div className="aspect-[3/2] bg-cover bg-center" style={{ backgroundImage: `url(${foto.thumbUrl})` }} />
                            <div className="p-1 flex justify-center">
                              {compra.status === 'PAGA' ? (
                                <a href={ecommerceService.downloadUrl(token, foto.id)}
                                  className="text-primary hover:underline text-[10px] flex items-center gap-0.5">
                                  <Download className="h-3 w-3" />
                                  Download
                                </a>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">Aguardando</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detalhe && detalhe.urlComprovante && (
                    <a href={detalhe.urlComprovante} target="_blank" rel="noopener noreferrer"
                      className="text-primary underline text-xs flex items-center gap-1">
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
