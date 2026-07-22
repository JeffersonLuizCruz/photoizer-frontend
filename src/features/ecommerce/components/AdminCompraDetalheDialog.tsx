import { useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { ecommerceService } from '../services/ecommerce.service'
import type { AdminCompraDetalheResponse } from '../types/ecommerce.types'

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-background rounded-xl border shadow-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Detalhe da Compra</h2>
          <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : detalhe ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
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
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Comprovante</span>
                {detalhe.urlComprovante ? (
                  <a href={detalhe.urlComprovante} target="_blank" rel="noopener noreferrer" className="block text-primary underline text-sm mt-0.5">Ver comprovante</a>
                ) : (
                  <p className="text-sm mt-0.5">—</p>
                )}
              </div>
            </div>

            {detalhe.fotos.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-2">FOTOS ({detalhe.fotos.length})</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {detalhe.fotos.map((foto) => (
                    <div key={foto.id} className="rounded-lg border bg-card overflow-hidden">
                      <div className="aspect-[3/2] bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${foto.thumbUrl})` }} />
                      <div className="p-1 flex justify-center">
                        <a href={foto.originalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] flex items-center gap-0.5">
                          <Download className="h-3 w-3" />
                          Original
                        </a>
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
      </div>
    </div>
  )
}
