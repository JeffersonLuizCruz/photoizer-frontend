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
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-sky-100/95 via-amber-50/95 to-amber-50/95 backdrop-blur" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <h2 className="font-display text-sm font-semibold text-cyan-950">Comparar Fotos ({fotos.length})</h2>
        <button onClick={onClose} className="rounded-full bg-white/80 p-2 text-cyan-700 shadow ring-1 ring-cyan-100 transition-colors hover:bg-white" aria-label="Fechar comparador de fotos">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className={`grid flex-1 ${gridClass} gap-3 overflow-y-auto p-4`}>
        {fotos.map((foto) => {
          const isSelected = selectedIds.has(foto.id)
          return (
            <div key={foto.id} className="flex min-h-0 flex-col">
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-cyan-100">
                <img
                  src={foto.watermarkedUrl}
                  alt={foto.fileName}
                  draggable={false}
                  className="pointer-events-none max-h-full max-w-full select-none object-contain" />
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="truncate text-xs text-slate-500">{foto.fileName}</span>
                <button
                  onClick={() => onToggleSelect(foto.id)}
                  disabled={!isSelected && selectedIds.size >= pacoteLimit}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-white text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-50 disabled:opacity-40'
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
