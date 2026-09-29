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
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-cyan-100 bg-white">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-400 px-4 pb-2 pt-[env(safe-area-inset-top)] text-white">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <ShoppingCart className="h-4 w-4" />
            Meu Carrinho
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/20" title="Fechar">
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
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {pacoteFotos.map((foto) => (
                  <div key={foto.id} className="relative aspect-[3/2] overflow-hidden rounded-lg border border-cyan-100 bg-muted">
                    <img
                      src={foto.thumbUrl}
                      alt={foto.fileName}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover" />
                    <span className="absolute bottom-0.5 left-0.5 rounded-sm bg-teal-500/90 px-1 py-px text-[9px] font-medium text-white">
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
                  <li key={foto.id} className="flex items-center gap-3 rounded-xl border border-cyan-100 p-2">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      aria-label={`Remover ${foto.fileName} do carrinho`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Resumo */}
          <section className="space-y-1.5 rounded-2xl bg-cyan-50/60 p-3 ring-1 ring-cyan-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Subtotal extras: {cartFotos.length} × {formatBRL(valorUnitario)}
              </span>
              <span className="font-medium text-slate-800">{formatBRL(subtotalExtras)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-cyan-100 pt-1.5 text-sm font-semibold text-cyan-950">
              <span>Total</span>
              <span>{formatBRL(subtotalExtras)}</span>
            </div>
            {selectedIds.size === pacoteLimit && pacoteLimit > 0 && (
              <p className="text-[11px] font-medium text-teal-600">
                Você aproveitou 100% do seu pacote!
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-cyan-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onCheckout}
            disabled={cartFotos.length === 0}
            className="w-full rounded-2xl border-0 bg-gradient-to-r from-orange-400 to-rose-400 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:from-orange-500 hover:to-rose-500 disabled:cursor-not-allowed disabled:opacity-50">
            Finalizar Compra ({formatBRL(subtotalExtras)})
          </button>
        </div>
      </div>
    </>
  )
}
