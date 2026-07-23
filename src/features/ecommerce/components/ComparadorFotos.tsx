import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { FotoEnsaio } from '../types/ecommerce.types'

interface ComparadorFotosProps {
  fotos: FotoEnsaio[]
  onClose: () => void
  selectedIds: Set<string>
  pacoteLimit: number
  onToggleSelect: (fotoId: string) => void
}

export function ComparadorFotos({ fotos, onClose, selectedIds, pacoteLimit, onToggleSelect }: ComparadorFotosProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const gridClass = fotos.length === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <h2 className="text-sm font-semibold text-white">Comparar Fotos ({fotos.length})</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Fechar (Esc)">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className={`flex-1 grid ${gridClass} gap-3 p-4 overflow-y-auto`}>
        {fotos.map((foto) => {
          const isSelected = selectedIds.has(foto.id)
          return (
            <div key={foto.id} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 flex items-center justify-center bg-black/40 rounded-lg overflow-hidden">
                <img
                  src={foto.watermarkedUrl}
                  alt={foto.fileName}
                  draggable={false}
                  className="max-h-full max-w-full object-contain select-none pointer-events-none" />
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="text-xs text-white/70 truncate">{foto.fileName}</span>
                <button
                  onClick={() => onToggleSelect(foto.id)}
                  disabled={!isSelected && selectedIds.size >= pacoteLimit}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-40'
                  }`}>
                  {isSelected ? 'Remover' : 'Incluir no pacote'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
