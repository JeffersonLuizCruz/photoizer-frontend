import { X, Trash2, ShoppingCart } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import type { FotoEnsaio } from '../types/ecommerce.types'
import { numeroGaleriaLabel, rotuloFoto } from '@/shared/lib/foto'

interface CartSummaryPanelProps {
  open: boolean
  onClose: () => void
  fotos: FotoEnsaio[]
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  pacoteLimit: number
  valorUnitario: number
  valoresExtras: Record<string, number>
  extrasEmSelecao: boolean
  podeComprar: boolean
  podeEditarCarrinho: boolean
  onRemoveFromCart: (fotoId: string) => void
  onCheckout: () => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CartSummaryPanel({
  open, onClose, fotos, selectedIds, carrinhoIds,
  pacoteLimit, valorUnitario, valoresExtras, extrasEmSelecao,
  podeComprar, podeEditarCarrinho, onRemoveFromCart, onCheckout,
}: CartSummaryPanelProps) {
  const pacoteFotos = fotos.filter((f) => selectedIds.has(f.id))
  const cartFotos = fotos.filter((f) => carrinhoIds.has(f.id))
  const valorFoto = (fotoId: string) => valoresExtras[fotoId] ?? valorUnitario
  const subtotalExtras = cartFotos.reduce((total, foto) => total + valorFoto(foto.id), 0)

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent hideClose className="h-dvh max-h-none w-full max-w-md gap-0 overflow-hidden border-l border-gallery-line bg-gallery-surface p-0 sm:h-full">
        {/* Header */}
        <div className="flex min-h-14 shrink-0 items-center justify-between bg-gradient-to-r from-gallery-ink via-gallery-ink to-gallery-ink px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-white">
          <SheetTitle className="flex items-center gap-2 font-display text-sm font-semibold">
            <ShoppingCart className="h-4 w-4" />
            {extrasEmSelecao ? 'Extras da seleção' : 'Meu Carrinho'}
          </SheetTitle>
          <button onClick={onClose} className="rounded-lg flex h-11 w-11 items-center justify-center transition-colors hover:bg-white/20" title="Fechar">
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
                  <div key={foto.id} className="relative aspect-[3/2] overflow-hidden rounded-lg border border-gallery-line bg-muted">
                    <img
                      src={foto.thumbUrl}
                      alt={rotuloFoto(foto)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover" />
                    {foto.numeroGaleria != null && (
                      <span className="absolute left-0.5 top-0.5 rounded-sm bg-gallery-ink/70 px-1 py-px text-[9px] font-semibold tabular-nums text-white backdrop-blur">
                        {numeroGaleriaLabel(foto.numeroGaleria)}
                      </span>
                    )}
                    <span className="absolute bottom-0.5 left-0.5 rounded-sm bg-gallery-accent/90 px-1 py-px text-[9px] font-medium text-white">
                      Incluída
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Fotos Extras */}
          <section>
            <h3 className="text-xs font-semibold mb-2">
              {extrasEmSelecao ? 'Extras da seleção' : 'Fotos Extras'} ({cartFotos.length})
            </h3>
            {cartFotos.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {extrasEmSelecao
                  ? 'Nenhuma foto extra marcada para edição.'
                  : 'Nenhuma foto extra no carrinho.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {cartFotos.map((foto) => (
                  <li key={foto.id} className="flex items-center gap-3 rounded-xl border border-gallery-line p-2">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={foto.thumbUrl}
                        alt={rotuloFoto(foto)}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium">
                        {foto.numeroGaleria != null ? numeroGaleriaLabel(foto.numeroGaleria) : 'Foto extra'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatBRL(valorFoto(foto.id))}</p>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(foto.id)}
                      disabled={!podeEditarCarrinho}
                      className="rounded-lg flex h-11 w-11 items-center justify-center text-gallery-muted transition-colors hover:bg-gallery-line/40 hover:text-gallery-accent disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remover ${foto.fileName} do carrinho`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Resumo */}
          <section className="space-y-1.5 rounded-2xl bg-gallery-bg p-3 ring-1 ring-gallery-line">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gallery-muted">
                {extrasEmSelecao ? 'Valor estimado dos extras' : 'Subtotal extras'}: {cartFotos.length} foto(s)
              </span>
              <span className="font-medium text-gallery-ink">{formatBRL(subtotalExtras)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gallery-line pt-1.5 text-sm font-semibold text-gallery-ink">
              <span>Total</span>
              <span>{formatBRL(subtotalExtras)}</span>
            </div>
            {selectedIds.size === pacoteLimit && pacoteLimit > 0 && (
              <p className="text-[11px] font-medium text-gallery-accent">
                Você aproveitou 100% do seu pacote!
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gallery-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {!podeComprar && (
            <p className="mb-2 text-center text-[11px] font-medium text-gallery-accent">
              {podeEditarCarrinho
                ? 'Envie a seleção para que o estúdio edite as fotos antes da compra.'
                : 'A compra será liberada após a publicação da edição.'}
            </p>
          )}
          <button
            onClick={onCheckout}
            disabled={cartFotos.length === 0 || !podeComprar}
            className="w-full rounded-full border-0 bg-gallery-ink py-2.5 text-sm font-semibold text-gallery-bg shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            Finalizar Compra ({formatBRL(subtotalExtras)})
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
