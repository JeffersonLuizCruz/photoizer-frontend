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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {fotos.map((foto, index) => {
        const isSelected = selectedIds.has(foto.id)
        const isInCart = carrinhoIds.has(foto.id)
        const pendente = !!foto.compraExtraId && foto.status !== 'PAGA'
        const jaComprada = foto.status === 'PAGA'
        const isCartLoading = cartLoadingIds.has(foto.id)
        const isFavorito = favoritoIds.has(foto.id)
        const isComparing = compareIds.has(foto.id)
        const packageFull = selectedIds.size >= pacoteLimit

        return (
          <div key={foto.id} className="group relative motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1.5">
            <div className={cn(
              'aspect-[3/2] rounded-xl border bg-muted cursor-pointer overflow-hidden relative shadow-sm transition-shadow duration-300 hover:shadow-xl',
              compareMode && isComparing ? 'ring-2 ring-blue-500' : '',
              'outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
            )}
              onClick={() => compareMode ? onToggleCompare(foto.id) : onView(index)}>
              <img
                src={foto.watermarkedUrl}
                alt={foto.fileName}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover rounded-xl select-none pointer-events-none motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.06]" />

              {/* Overlay de gradiente no hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300" style={{ pointerEvents: 'none', userSelect: 'none' }} />

              {(isSelected || isInCart || jaComprada || pendente) && (
                <div className={cn(
                  'absolute top-2 left-2 h-5 w-5 rounded-full flex items-center justify-center shadow-md',
                  jaComprada ? 'bg-blue-500' : isInCart ? 'bg-blue-500' : pendente ? 'bg-amber-500' : 'bg-emerald-500'
                )}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorito(foto.id) }}
                title={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/60 motion-safe:transition-all motion-safe:duration-200 hover:scale-110 active:scale-95">
                <Heart
                  className={cn('h-4 w-4 motion-safe:transition-transform motion-safe:duration-200', isFavorito ? 'text-rose-400' : 'text-white/80')}
                  fill={isFavorito ? 'currentColor' : 'none'} />
              </button>

              {/* Ações reveladas no hover */}
              <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 motion-safe:transition-all motion-safe:duration-300">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenComments(index) }}
                  title="Comentar nesta foto"
                  className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-blue-600 motion-safe:transition-colors active:scale-95">
                  <MessageCirclePlus className="h-3.5 w-3.5" />
                  Comentar
                </button>
              </div>

              <div className="absolute bottom-2 left-2">
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-sm backdrop-blur-sm',
                  jaComprada ? 'bg-blue-500/80 text-white' :
                    isInCart ? 'bg-blue-500/80 text-white' :
                      pendente ? 'bg-amber-500/80 text-white' :
                        isSelected ? 'bg-emerald-500/80 text-white' :
                          !packageFull ? 'bg-black/40 text-white' :
                            'bg-amber-500/80 text-white'
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
                  className="flex items-center justify-center gap-1 rounded text-[11px] text-blue-600 dark:text-blue-400 font-medium py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 motion-safe:transition-colors">
                  <Download className="h-3 w-3" />
                  Download
                </a>
              ) : pendente ? (
                <span className="block text-center rounded py-1.5 text-[11px] font-medium bg-muted text-muted-foreground">
                  Aguardando confirmação
                </span>
              ) : isSelected ? (
                foto.downloadada ? (
                  <a href={ecommerceService.downloadUrl(token, foto.id)}
                    className="flex items-center justify-center gap-1 rounded text-[11px] text-emerald-600 dark:text-emerald-400 font-medium py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 motion-safe:transition-colors">
                    <Download className="h-3 w-3" />
                    Baixada
                  </a>
                ) : (
                  <button onClick={() => onSelect(foto.id)}
                    className="w-full rounded py-1.5 text-[11px] font-medium motion-safe:transition-colors bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50">
                    Remover
                  </button>
                )
              ) : isInCart ? (
                <button onClick={() => onToggleCarrinho(foto.id)} disabled={isCartLoading}
                  className={cn(
                    'w-full rounded py-1.5 text-[11px] font-medium motion-safe:transition-colors',
                    isCartLoading ? 'bg-muted text-muted-foreground' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                  )}>
                  {isCartLoading ? '...' : 'Remover'}
                </button>
              ) : !packageFull ? (
                <button onClick={() => onSelect(foto.id)}
                  className="w-full rounded py-1.5 text-[11px] font-medium motion-safe:transition-colors bg-muted text-muted-foreground hover:bg-accent">
                  Incluir
                </button>
              ) : (
                <button onClick={() => onToggleCarrinho(foto.id)} disabled={isCartLoading}
                  className={cn(
                    'w-full rounded py-1.5 text-[11px] font-medium motion-safe:transition-colors',
                    isCartLoading ? 'bg-muted text-muted-foreground' :
                      'bg-muted text-muted-foreground hover:bg-accent'
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