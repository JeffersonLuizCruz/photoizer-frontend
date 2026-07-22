import { Check, Download } from 'lucide-react'
import type { FotoEnsaio } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'

interface PhotoGridProps {
  fotos: FotoEnsaio[]
  token: string
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  cartLoadingIds: Set<string>
  pacoteLimit: number
  valorUnitario: number
  onSelect: (fotoId: string) => void
  onToggleCarrinho: (fotoId: string) => void
  onView: (index: number) => void
}

export function PhotoGrid({
  fotos, token, selectedIds, carrinhoIds, cartLoadingIds,
  pacoteLimit, valorUnitario, onSelect, onToggleCarrinho, onView,
}: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {fotos.map((foto, index) => {
        const isSelected = selectedIds.has(foto.id)
        const isInCart = carrinhoIds.has(foto.id)
        const isFree = index < pacoteLimit
        const jaComprada = foto.status === 'PAGA' || foto.compraExtraId
        const isCartLoading = cartLoadingIds.has(foto.id)

        return (
          <div key={foto.id} className="group relative">
            <div className="aspect-[3/2] rounded-lg border bg-muted bg-cover bg-center cursor-pointer overflow-hidden relative"
              style={{ backgroundImage: `url(${foto.watermarkedUrl})` }}
              onClick={() => onView(index)}>
              <div className="absolute inset-0" style={{ pointerEvents: 'none', userSelect: 'none' }} />
              {(isSelected || isInCart || jaComprada) && (
                <div className={`absolute top-2 left-2 h-5 w-5 rounded-full flex items-center justify-center ${
                  jaComprada ? 'bg-blue-500' : isInCart ? 'bg-blue-500' : 'bg-emerald-500'
                }`}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="absolute bottom-2 left-2">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                  jaComprada ? 'bg-blue-500/80 text-white' :
                  isInCart ? 'bg-blue-500/80 text-white' :
                  isSelected ? 'bg-emerald-500/80 text-white' :
                  isFree ? 'bg-muted-foreground/40 text-white' :
                  'bg-amber-500/80 text-white'
                }`}>
                  {jaComprada ? 'Adquirida' :
                   isInCart ? `R$ ${valorUnitario.toFixed(2)}` :
                   isSelected ? 'Inclusa' :
                   isFree ? 'Disponível' : `R$ ${valorUnitario.toFixed(2)}`}
                </span>
              </div>
            </div>
            <div className="mt-1">
              {isFree && !jaComprada && (
                <button onClick={() => onSelect(foto.id)}
                  disabled={!isSelected && selectedIds.size >= pacoteLimit}
                  className={`w-full rounded py-1 text-[11px] font-medium transition-colors ${
                    isSelected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-muted text-muted-foreground hover:bg-accent disabled:opacity-30'
                  }`}>
                  {isSelected ? 'Remover' : selectedIds.size >= pacoteLimit ? 'Limite' : 'Incluir'}
                </button>
              )}
              {!isFree && !jaComprada && (
                <button onClick={() => onToggleCarrinho(foto.id)} disabled={isCartLoading}
                  className={`w-full rounded py-1 text-[11px] font-medium transition-colors ${
                    isCartLoading ? 'bg-muted text-muted-foreground' :
                    isInCart ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-muted text-muted-foreground hover:bg-accent'
                  }`}>
                  {isCartLoading ? '...' : isInCart ? 'Remover' : `Comprar R$ ${valorUnitario.toFixed(2)}`}
                </button>
              )}
              {jaComprada && (
                <a href={ecommerceService.downloadUrl(token, foto.id)}
                  className="flex items-center justify-center gap-1 rounded text-[11px] text-blue-600 dark:text-blue-400 font-medium py-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                  <Download className="h-3 w-3" />
                  Download
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
