import { Check, Download, Heart, MessageCirclePlus } from 'lucide-react'
import type { FotoEnsaio } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'

interface PhotoGridProps {
  fotos: FotoEnsaio[]
  token: string
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  cartLoadingIds: Set<string>
  pacoteLimit: number
  valorUnitario: number
  favoritoIds: Set<string>
  compareIds: Set<string>
  compareMode: boolean
  onSelect: (fotoId: string) => void
  onToggleCarrinho: (fotoId: string) => void
  onToggleFavorito: (fotoId: string) => void
  onToggleCompare: (fotoId: string) => void
  onView: (index: number) => void
  onOpenComments: (index: number) => void
}

export function PhotoGrid({
  fotos, token, selectedIds, carrinhoIds, cartLoadingIds,
  pacoteLimit, valorUnitario, favoritoIds, compareIds, compareMode,
  onSelect, onToggleCarrinho, onToggleFavorito, onToggleCompare, onView, onOpenComments,
}: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {fotos.map((foto, index) => {
        const isSelected = selectedIds.has(foto.id)
        const isInCart = carrinhoIds.has(foto.id)
        const pendente = !!foto.compraExtraId && foto.status !== 'PAGA'
        const jaComprada = foto.status === 'PAGA'
        const isCartLoading = cartLoadingIds.has(foto.id)
        const isFavorito = favoritoIds.has(foto.id)
        const isComparing = compareIds.has(foto.id)
        const packageFull = selectedIds.size >= pacoteLimit

        const abrirFoto = () => {
          if (compareMode) onToggleCompare(foto.id)
          else onView(index)
        }

        return (
          <div key={foto.id} className="group relative motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1.5">
            <div
              role="button"
              tabIndex={0}
              aria-label={compareMode ? `Comparar ${foto.fileName}` : `Visualizar ${foto.fileName}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  abrirFoto()
                }
              }}
              className={cn(
                'relative aspect-[3/2] cursor-pointer overflow-hidden rounded-xl border border-cyan-100 bg-muted shadow-sm outline-none transition-shadow duration-300 hover:shadow-xl',
                compareMode && isComparing ? 'ring-2 ring-cyan-500' : '',
                'focus-visible:ring-2 focus-visible:ring-cyan-500',
              )}
              onClick={() => abrirFoto()}>
              <img
                src={foto.watermarkedUrl}
                alt={foto.fileName}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none rounded-xl object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.06]" />

              {/* Overlay de gradiente no hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 motion-safe:transition-opacity motion-safe:duration-300 group-hover:opacity-100" style={{ pointerEvents: 'none', userSelect: 'none' }} />

              {(isSelected || isInCart || jaComprada || pendente) && (
                <div className={cn(
                  'absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full shadow-md',
                  jaComprada ? 'bg-cyan-500' : isInCart ? 'bg-cyan-500' : pendente ? 'bg-amber-500' : 'bg-teal-500',
                )}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorito(foto.id) }}
                aria-label={isFavorito ? `Remover ${foto.fileName} do Gostei` : `Marcar ${foto.fileName} como Gostei`}
                title={isFavorito ? 'Remover Gostei' : 'Gostei'}
                className={cn(
                  'absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md ring-1 backdrop-blur transition-all motion-safe:duration-200 hover:scale-110 active:scale-95',
                  isFavorito
                    ? 'bg-rose-500 text-white ring-rose-300'
                    : 'bg-white/85 text-slate-500 ring-white/70 hover:text-rose-500',
                )}>
                <Heart className="h-4 w-4" fill={isFavorito ? 'currentColor' : 'none'} />
              </button>

              {/* Ações reveladas no hover */}
              <div className="absolute bottom-2 right-2 translate-y-0 opacity-100 motion-safe:transition-all motion-safe:duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenComments(index) }}
                  aria-label={`Comentar em ${foto.fileName}`}
                  className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-2 text-xs font-medium text-white backdrop-blur motion-safe:transition-colors hover:bg-cyan-600 active:scale-95">
                  <MessageCirclePlus className="h-3.5 w-3.5" />
                  Comentar
                </button>
              </div>

              <div className="absolute bottom-2 left-2">
                <span className={cn(
                  'rounded-sm px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm',
                  jaComprada ? 'bg-cyan-500/80 text-white' :
                    isInCart ? 'bg-cyan-500/80 text-white' :
                      pendente ? 'bg-amber-500/80 text-white' :
                        isSelected ? 'bg-teal-500/80 text-white' :
                          !packageFull ? 'bg-black/40 text-white' :
                            'bg-amber-500/80 text-white',
                )}>
                  {jaComprada ? 'Adquirida' :
                    isInCart ? `R$ ${valorUnitario.toFixed(2)}` :
                      pendente ? 'Aguardando' :
                        isSelected ? 'Inclusa' :
                          !packageFull ? 'Disponível' : `R$ ${valorUnitario.toFixed(2)}`}
                </span>
              </div>
            </div>
            <div className="mt-1.5">
              {jaComprada ? (
                <a href={ecommerceService.downloadUrl(token, foto.id)}
                  className="flex items-center justify-center gap-1 rounded py-1.5 text-[11px] font-medium text-cyan-700 motion-safe:transition-colors hover:bg-cyan-50">
                  <Download className="h-3 w-3" />
                  Download
                </a>
              ) : pendente ? (
                <span className="block rounded bg-amber-100 py-2 text-center text-xs font-medium text-amber-700">
                  Aguardando confirmação
                </span>
              ) : isSelected ? (
                foto.downloadada ? (
                  <a href={ecommerceService.downloadUrl(token, foto.id)}
                    className="flex items-center justify-center gap-1 rounded bg-teal-50 py-1.5 text-[11px] font-medium text-teal-700 motion-safe:transition-colors hover:bg-teal-100">
                    <Download className="h-3 w-3" />
                    Baixada
                  </a>
                ) : (
                  <button onClick={() => onSelect(foto.id)}
                    className="w-full rounded bg-teal-100 py-2 text-xs font-medium text-teal-700 motion-safe:transition-colors hover:bg-teal-200">
                    Remover
                  </button>
                )
              ) : isInCart ? (
                <button onClick={() => onToggleCarrinho(foto.id)} disabled={isCartLoading}
                  className={cn(
                    'w-full rounded py-2 text-xs font-medium motion-safe:transition-colors',
                    isCartLoading ? 'bg-muted text-muted-foreground' :
                      'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
                  )}>
                  {isCartLoading ? '...' : 'Remover'}
                </button>
              ) : !packageFull ? (
                <button onClick={() => onSelect(foto.id)}
                  className="w-full rounded bg-cyan-50 py-2 text-xs font-medium text-cyan-700 motion-safe:transition-colors hover:bg-cyan-100">
                  Incluir
                </button>
              ) : (
                <button onClick={() => onToggleCarrinho(foto.id)} disabled={isCartLoading}
                  className={cn(
                    'w-full rounded py-2 text-xs font-medium motion-safe:transition-colors',
                    isCartLoading ? 'bg-muted text-muted-foreground' :
                      'bg-orange-100 text-orange-700 hover:bg-orange-200',
                  )}>
                  {isCartLoading ? '...' : `Comprar R$ ${valorUnitario.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
