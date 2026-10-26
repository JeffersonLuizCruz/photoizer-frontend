import { X, Heart, Check, ShoppingCart, Trash2, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import type { FotoEnsaio } from '../types/ecommerce.types'
import { cn } from '@/shared/lib/cn'
import { numeroGaleriaLabel, rotuloFoto } from '@/shared/lib/foto'

interface FavoritosPanelProps {
  open: boolean
  onClose: () => void
  fotos: FotoEnsaio[]
  favoritoIds: Set<string>
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  pacoteLimit: number
  valorUnitario: number
  valoresExtras: Record<string, number>
  extrasEmSelecao: boolean
  podeSelecionar: boolean
  podeComprar: boolean
  onToggleSelect: (fotoId: string) => void
  onToggleCarrinho: (fotoId: string) => void
  onToggleFavorito: (fotoId: string) => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function FavoritosPanel({
  open, onClose, fotos, favoritoIds, selectedIds, carrinhoIds,
  pacoteLimit, valorUnitario, valoresExtras, extrasEmSelecao,
  podeSelecionar, podeComprar, onToggleSelect, onToggleCarrinho, onToggleFavorito,
}: FavoritosPanelProps) {
  const favoritas = fotos.filter((f) => favoritoIds.has(f.id))
  const packageFull = selectedIds.size >= pacoteLimit
  const valorFoto = (fotoId: string) => valoresExtras[fotoId] ?? valorUnitario

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent hideClose className="h-dvh max-h-none w-full max-w-md gap-0 overflow-hidden border-l border-gallery-line bg-gallery-surface p-0 sm:h-full">
        {/* Header */}
        <div className="flex min-h-14 shrink-0 items-center justify-between bg-gradient-to-r from-gallery-ink via-gallery-ink to-gallery-ink px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-white">
          <SheetTitle className="flex items-center gap-2 font-display text-sm font-semibold">
            <Heart className="h-4 w-4" fill="currentColor" />
            Gostei ({favoritas.length})
          </SheetTitle>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/20" title="Fechar" aria-label="Fechar favoritos">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {favoritas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Heart className="h-10 w-10 text-gallery-line" />
              <p className="text-sm font-medium text-gallery-ink">Nenhuma foto curtida ainda</p>
              <p className="max-w-[240px] text-xs text-gallery-muted">
                Toque no coração das fotos para marcar as que você mais gostou e encontrá-las aqui.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {favoritas.map((foto) => {
                const isSelected = selectedIds.has(foto.id)
                const isInCart = carrinhoIds.has(foto.id)

                let action: { label: string; onClick: () => void; className: string } | null = null
                if (isSelected) {
                  action = podeSelecionar ? {
                    label: 'Remover do pacote',
                    onClick: () => onToggleSelect(foto.id),
                    className: 'bg-gallery-line text-gallery-ink hover:bg-gallery-line/70',
                  } : null
                } else if (isInCart) {
                  action = podeComprar ? {
                    label: extrasEmSelecao ? 'Remover dos extras' : 'Remover do carrinho',
                    onClick: () => onToggleCarrinho(foto.id),
                    className: 'bg-gallery-line text-gallery-ink hover:bg-gallery-line/70',
                  } : null
                } else if (!packageFull && podeSelecionar) {
                  action = {
                    label: 'Incluir no pacote',
                    onClick: () => onToggleSelect(foto.id),
                    className: 'bg-gallery-line text-gallery-ink hover:bg-gallery-line/70',
                  }
                } else if (podeComprar) {
                  action = {
                    label: extrasEmSelecao ? 'Incluir extra' : `Comprar ${formatBRL(valorFoto(foto.id))}`,
                    onClick: () => onToggleCarrinho(foto.id),
                    className: 'bg-gallery-ink text-gallery-bg hover:opacity-90',
                  }
                }

                return (
                  <li key={foto.id} className="rounded-2xl border border-gallery-line p-2">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gallery-line/40">
                        <img
                          src={foto.thumbUrl}
                          alt={rotuloFoto(foto)}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gallery-ink">
                          {foto.titulo || (foto.numeroGaleria != null ? numeroGaleriaLabel(foto.numeroGaleria) : 'Foto')}
                        </p>
                        <p className="text-[11px] text-gallery-muted">
                          {isSelected ? 'No pacote' : isInCart
                            ? (extrasEmSelecao ? 'Extra na seleção' : 'No carrinho')
                            : formatBRL(valorFoto(foto.id))}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleFavorito(foto.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gallery-accent transition-colors hover:bg-gallery-line/40"
                        title="Remover Gostei"
                        aria-label={`Remover ${foto.fileName} do Gostei`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {action ? (
                      <button
                        onClick={action.onClick}
                        className={cn(
                          'mt-2 flex w-full min-h-11 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors',
                          action.className,
                        )}>
                        {action.label.startsWith('Comprar') || action.label.startsWith('Incluir extra')
                          ? <ShoppingCart className="h-3.5 w-3.5" />
                          : action.label.startsWith('Remover do pacote')
                            ? <Check className="h-3.5 w-3.5" />
                            : <Plus className="h-3.5 w-3.5" />}
                        {action.label}
                      </button>
                    ) : (
                      <p className="mt-2 rounded-lg bg-gallery-bg py-2 text-center text-xs font-medium text-gallery-muted">
                        {isSelected ? 'No pacote' : isInCart
                          ? (extrasEmSelecao ? 'Extra na seleção' : 'No carrinho')
                          : 'Aguardando edição'}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
