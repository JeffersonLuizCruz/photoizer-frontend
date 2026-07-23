import { X, Trash2, ShoppingCart } from 'lucide-react'
import type { FotoEnsaio } from '../types/ecommerce.types'

interface CartSummaryPanelProps {
  open: boolean
  onClose: () => void
  fotos: FotoEnsaio[]
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  pacoteLimit: number
  valorUnitario: number
  onRemoveFromCart: (fotoId: string) => void
  onCheckout: () => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CartSummaryPanel({
  open, onClose, fotos, selectedIds, carrinhoIds,
  pacoteLimit, valorUnitario, onRemoveFromCart, onCheckout,
}: CartSummaryPanelProps) {
  if (!open) return null

  const pacoteFotos = fotos.filter((f) => selectedIds.has(f.id))
  const cartFotos = fotos.filter((f) => carrinhoIds.has(f.id))
  const subtotalExtras = cartFotos.length * valorUnitario

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Meu Carrinho
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Fotos do Pacote */}
          <section>
            <h3 className="text-xs font-semibold mb-1">
              Fotos do Pacote ({pacoteFotos.length} de {pacoteLimit})
            </h3>
            <p className="text-[11px] text-muted-foreground mb-2">Sem custo adicional</p>
            {pacoteFotos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma foto selecionada para o pacote.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {pacoteFotos.map((foto) => (
                  <div key={foto.id} className="relative aspect-[3/2] rounded-md overflow-hidden border bg-muted">
                    <img
                      src={foto.thumbUrl}
                      alt={foto.fileName}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover" />
                    <span className="absolute bottom-0.5 left-0.5 text-[9px] font-medium px-1 py-px rounded-sm bg-emerald-500/90 text-white">
                      Incluída
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Fotos Extras */}
          <section>
            <h3 className="text-xs font-semibold mb-2">Fotos Extras ({cartFotos.length})</h3>
            {cartFotos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma foto extra no carrinho.</p>
            ) : (
              <ul className="space-y-2">
                {cartFotos.map((foto) => (
                  <li key={foto.id} className="flex items-center gap-3 rounded-lg border p-2">
                    <div className="h-12 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                      <img
                        src={foto.thumbUrl}
                        alt={foto.fileName}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{foto.fileName}</p>
                      <p className="text-[11px] text-muted-foreground">{formatBRL(valorUnitario)}</p>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(foto.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remover do carrinho">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Resumo */}
          <section className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Subtotal extras: {cartFotos.length} × {formatBRL(valorUnitario)}
              </span>
              <span className="font-medium">{formatBRL(subtotalExtras)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold border-t pt-1.5">
              <span>Total</span>
              <span>{formatBRL(subtotalExtras)}</span>
            </div>
            {selectedIds.size === pacoteLimit && pacoteLimit > 0 && (
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Você aproveitou 100% do seu pacote!
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-4 shrink-0">
          <button
            onClick={onCheckout}
            disabled={cartFotos.length === 0}
            className="w-full rounded-lg bg-blue-600 text-white py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Finalizar Compra ({formatBRL(subtotalExtras)})
          </button>
        </div>
      </div>
    </>
  )
}
