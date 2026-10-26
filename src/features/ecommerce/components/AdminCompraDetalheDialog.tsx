import { useEffect, useState } from 'react'
import { Download, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import { ecommerceService } from '../services/ecommerce.service'
import type { AdminCompraDetalheResponse } from '../types/ecommerce.types'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { downloadProtected, openProtected } from '@/shared/api'
import { numeroGaleriaLabel, rotuloFoto } from '@/shared/lib/foto'

interface AdminCompraDetalheDialogProps {
  compraId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminCompraDetalheDialog({ compraId, open, onOpenChange }: AdminCompraDetalheDialogProps) {
  const [detalhe, setDetalhe] = useState<AdminCompraDetalheResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !compraId) return
    setIsLoading(true)
    ecommerceService.adminCompraDetalhe(compraId)
      .then(setDetalhe)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [open, compraId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalhe da Compra</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : detalhe ? (
          <>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground text-xs">ID</span>
                <p className="font-mono text-xs">{detalhe.id.slice(0, 8)}...</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Status</span>
                <p className="font-medium">{detalhe.status}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Valor Total</span>
                <p className="font-medium">R$ {detalhe.valorTotal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Qtd. Fotos</span>
                <p className="font-medium">{detalhe.quantidadeFotos ?? '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Pagamento</span>
                <p className="font-medium">{detalhe.metodoPagamento ?? '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Data Pagamento</span>
                <p className="font-medium">{detalhe.dataPagamento ? new Date(detalhe.dataPagamento).toLocaleDateString('pt-BR') : '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground text-xs">Comprovante</span>
                {detalhe.urlComprovante ? (
                  <button onClick={() => openProtected(detalhe.urlComprovante!)} className="block text-primary underline text-sm mt-0.5">Ver comprovante</button>
                ) : (
                  <p className="text-sm mt-0.5">—</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground text-xs">Link de pagamento (cartão)</span>
                {detalhe.linkPagamentoCartao ? (
                  <a href={detalhe.linkPagamentoCartao} target="_blank" rel="noopener noreferrer"
                    className="mt-0.5 flex items-center gap-1 text-sm text-primary underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir link
                  </a>
                ) : (
                  <p className="text-sm mt-0.5">—</p>
                )}
              </div>
              {detalhe.motivoRecusa && (
                <div className="sm:col-span-2 rounded-lg bg-rose-50 border border-rose-200 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Motivo da recusa
                  </div>
                  <p className="text-sm text-rose-500">{detalhe.motivoRecusa}</p>
                </div>
              )}
            </div>

            {detalhe.fotos.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-2">FOTOS ({detalhe.fotos.length})</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {detalhe.fotos.map((foto) => (
                    <div key={foto.id} className="rounded-lg border bg-card overflow-hidden">
                      <div className="relative">
                        <AuthImage src={foto.thumbUrl} alt={rotuloFoto(foto)} className="aspect-[3/2] w-full object-cover" />
                        {foto.numeroGaleria != null && (
                          <span className="absolute left-1 top-1 rounded bg-slate-950/70 px-1 py-0.5 text-[9px] font-semibold tabular-nums text-white backdrop-blur">
                            {numeroGaleriaLabel(foto.numeroGaleria)}
                          </span>
                        )}
                      </div>
                      <p className="truncate px-1 pt-1 text-[10px] text-muted-foreground" title={foto.fileName}>
                        {foto.fileName}
                      </p>
                      <div className="p-1 flex justify-center">
                        {foto.originalUrl ? (
                          <button onClick={() => downloadProtected(foto.originalUrl!, foto.fileName)}
                            className="text-primary hover:underline text-[10px] flex items-center gap-0.5">
                            <Download className="h-3 w-3" />
                            Original
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Original indisponível</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Compra não encontrada</p>
        )}
      </SheetContent>
    </Sheet>
  )
}
