import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { FotoEnsaio } from '../types/ecommerce.types'

interface ComparadorFotosProps {
  fotos: FotoEnsaio[]
  onClose: () => void
  selectedIds: Set<string>
  pacoteLimit: number
  podeSelecionar: boolean
  onToggleSelect: (fotoId: string) => void
}

export function ComparadorFotos({ fotos, onClose, selectedIds, pacoteLimit, podeSelecionar, onToggleSelect }: ComparadorFotosProps) {
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const gridClass = fotos.length <= 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : fotos.length === 3
      ? 'grid-cols-2 md:grid-cols-3'
      : 'grid-cols-2 md:grid-cols-4'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gallery-bg" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-gallery-line px-3 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-4">
        <h2 className="min-w-0 truncate font-display text-sm font-semibold text-gallery-ink">
          Comparar Fotos ({fotos.length})
        </h2>
        <button onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gallery-surface text-gallery-ink ring-1 ring-gallery-line transition-colors hover:bg-gallery-line/40"
          aria-label="Fechar comparador de fotos">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className={`grid flex-1 ${gridClass} gap-2 overflow-y-auto p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:gap-3 sm:p-4`}>
        {fotos.map((foto) => {
          const isSelected = selectedIds.has(foto.id)
          return (
            <div key={foto.id} className="flex min-h-0 flex-col">
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-sm bg-gallery-surface ring-1 ring-gallery-line">
                <img
                  src={foto.watermarkedUrl}
                  alt={foto.fileName}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="pointer-events-none max-h-full max-w-full select-none object-contain [-webkit-touch-callout:none]" />
              </div>
              <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 truncate text-xs text-gallery-muted" title={foto.fileName}>
                  {foto.fileName}
                </span>
                <button
                  onClick={() => onToggleSelect(foto.id)}
                  disabled={!podeSelecionar || (!isSelected && selectedIds.size >= pacoteLimit)}
                  className={`min-h-11 w-full shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:w-auto ${
                    isSelected
                      ? 'bg-gallery-accent text-white hover:opacity-90'
                      : 'bg-gallery-surface text-gallery-ink ring-1 ring-gallery-line hover:bg-gallery-line/40 disabled:opacity-40'
                  }`}>
                  {!podeSelecionar ? 'Seleção bloqueada' : isSelected ? 'Remover' : 'Incluir no pacote'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
