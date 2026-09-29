import { X, Heart, Check, ShoppingCart, Trash2, Plus } from 'lucide-react'
import type { FotoEnsaio } from '../types/ecommerce.types'
import { cn } from '@/shared/lib/cn'

interface FavoritosPanelProps {
  open: boolean
  onClose: () => void
  fotos: FotoEnsaio[]
  favoritoIds: Set<string>
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  pacoteLimit: number
  valorUnitario: number
  onToggleSelect: (fotoId: string) => void
  onToggleCarrinho: (fotoId: string) => void
  onToggleFavorito: (fotoId: string) => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function FavoritosPanel({
  open, onClose, fotos, favoritoIds, selectedIds, carrinhoIds,
  pacoteLimit, valorUnitario, onToggleSelect, onToggleCarrinho, onToggleFavorito,
}: FavoritosPanelProps) {
  if (!open) return null

  const favoritas = fotos.filter((f) => favoritoIds.has(f.id))
  const packageFull = selectedIds.size >= pacoteLimit

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-cyan-100 bg-white">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 px-4 pb-2 pt-[env(safe-area-inset-top)] text-white">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <Heart className="h-4 w-4" fill="currentColor" />
            Gostei ({favoritas.length})
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/20" title="Fechar" aria-label="Fechar favoritos">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {favoritas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Heart className="h-10 w-10 text-rose-200" />
              <p className="text-sm font-medium text-slate-600">Nenhuma foto curtida ainda</p>
              <p className="max-w-[240px] text-xs text-slate-400">
                Toque no coração das fotos para marcar as que você mais gostou e encontrá-las aqui.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {favoritas.map((foto) => {
                const isSelected = selectedIds.has(foto.id)
                const isInCart = carrinhoIds.has(foto.id)

                let action: { label: string; onClick: () => void; className: string; icon?: boolean }
                if (isSelected) {
                  action = {
                    label: 'Remover do pacote',
                    onClick: () => onToggleSelect(foto.id),
                    className: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
                  }
                } else if (!packageFull) {
                  action = {
                    label: 'Incluir no pacote',
                    onClick: () => onToggleSelect(foto.id),
                    className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
                    icon: true,
                  }
                } else if (isInCart) {
                  action = {
                    label: 'Remover do carrinho',
                    onClick: () => onToggleCarrinho(foto.id),
                    className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
                  }
                } else {
                  action = {
                    label: `Comprar ${formatBRL(valorUnitario)}`,
                    onClick: () => onToggleCarrinho(foto.id),
                    className: 'bg-gradient-to-r from-orange-400 to-rose-400 text-white hover:from-orange-500 hover:to-rose-500',
                    icon: true,
                  }
                }

                return (
                  <li key={foto.id} className="rounded-2xl border border-cyan-100 p-2">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={foto.thumbUrl}
                          alt={foto.fileName}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-700">{foto.fileName}</p>
                        <p className="text-[11px] text-slate-400">
                          {isSelected ? 'No pacote' : isInCart ? 'No carrinho' : formatBRL(valorUnitario)}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleFavorito(foto.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50"
                        title="Remover Gostei"
                        aria-label={`Remover ${foto.fileName} do Gostei`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={action.onClick}
                      className={cn(
                        'mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors',
                        action.className,
                      )}>
                      {action.icon && (action.label.startsWith('Comprar') ? <ShoppingCart className="h-3.5 w-3.5" /> : isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />)}
                      {action.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
