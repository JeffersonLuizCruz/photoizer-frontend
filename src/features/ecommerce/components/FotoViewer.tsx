import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Check, ShoppingCart, Loader2 } from 'lucide-react'
import type { FotoEnsaio } from '../types/ecommerce.types'

interface FotoViewerProps {
  fotos: FotoEnsaio[]
  currentIndex: number
  onClose: () => void
  onToggleSelect: (fotoId: string) => void
  onNavigate: (index: number) => void
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  pacoteLimit: number
  selectedCount: number
  onToggleCarrinho: (fotoId: string) => void
  valorUnitario: number
  cartLoadingIds: Set<string>
}

export function FotoViewer({
  fotos, currentIndex, onClose, onToggleSelect, onNavigate,
  selectedIds, carrinhoIds, pacoteLimit, selectedCount, onToggleCarrinho, valorUnitario, cartLoadingIds,
}: FotoViewerProps) {
  const foto = fotos[currentIndex]
  const isSelected = selectedIds.has(foto.id)
  const isInCart = carrinhoIds.has(foto.id)
  const isFree = currentIndex < pacoteLimit
  const isLoading = cartLoadingIds.has(foto.id)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < fotos.length - 1) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, fotos.length, onClose, onNavigate])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
        <X className="h-6 w-6 text-white" />
      </button>
      <span className="absolute top-4 left-4 z-10 text-white/60 text-sm">
        {currentIndex + 1} / {fotos.length}
      </span>
      {currentIndex > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}
      <div className="max-h-[85vh] max-w-[90vw] w-full h-full bg-contain bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${foto.watermarkedUrl})` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }} />
      </div>
      {currentIndex < fotos.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {isFree ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect(foto.id) }}
            disabled={isLoading || (!isSelected && selectedCount >= pacoteLimit)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              isSelected ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-40'
            }`}>
            <Check className={`h-4 w-4 ${isSelected ? '' : 'opacity-0'}`} />
            {isSelected ? 'Inclusa no pacote' : 'Incluir no pacote'}
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onToggleCarrinho(foto.id) }} disabled={isLoading}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              isLoading ? 'bg-white/10 text-white' :
              isInCart ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/10 text-white hover:bg-white/20'
            }`}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            {isLoading ? '' : isInCart ? `Remover` : `Comprar R$ ${valorUnitario.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}
