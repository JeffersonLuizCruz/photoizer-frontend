import { useState } from 'react'
import { Download, CheckCircle2, Circle, Trash2, Image, Images, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { FotoEdicaoStatusBadge } from './FotoEdicaoStatusBadge'
import type { FotoEdicao } from '../types'
import { cn } from '@/shared/lib/cn'

interface EdicaoGaleriaGridProps {
  fotos: FotoEdicao[]
  onDownloadRaw: (fotoId: string) => void
  onDownloadEdited: (fotoId: string) => void
  onDelete?: (fotoId: string) => void
  onReorder?: (fotos: { id: string; ordem: number }[]) => void
  getUploadProgress?: (fotoId: string) => number | undefined
}

export function EdicaoGaleriaGrid({ fotos, onDownloadRaw, onDownloadEdited, onDelete, onReorder }: EdicaoGaleriaGridProps) {
  const [showEdited, setShowEdited] = useState<Record<string, boolean>>({})

  if (fotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Circle className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">Nenhuma foto encontrada</p>
        <p className="mt-1 text-sm">As fotos aparecerão aqui após o upload.</p>
      </div>
    )
  }

  function toggleView(fotoId: string) {
    setShowEdited((prev) => ({ ...prev, [fotoId]: !prev[fotoId] }))
  }

  function mover(fotoId: string, direction: -1 | 1) {
    if (!onReorder) return
    const idx = fotos.findIndex((f) => f.id === fotoId)
    if (idx === -1) return
    const target = idx + direction
    if (target < 0 || target >= fotos.length) return

    const novaLista = fotos.map((f, i) => ({
      id: f.id,
      ordem: i === idx ? fotos[target].ordem : i === target ? fotos[idx].ordem : f.ordem,
    }))
    onReorder(novaLista)
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {fotos
        .slice()
        .sort((a, b) => a.ordem - b.ordem)
        .map((foto, index) => {
          const showingEdited = showEdited[foto.id] && foto.editedDownloadUrl

          return (
            <div
              key={foto.id}
              className={cn(
                'group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md',
              )}
            >
              <div className="aspect-square w-full overflow-hidden bg-muted">
                <img
                  src={showingEdited ? foto.editedPreviewUrl : foto.rawPreviewUrl}
                  alt={foto.rawFileName}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              <div className="absolute left-2 top-2">
                <FotoEdicaoStatusBadge status={foto.status} />
              </div>

              {foto.editedDownloadUrl && (
                <button
                  onClick={() => toggleView(foto.id)}
                  className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                  title={showingEdited ? 'Ver RAW' : 'Ver Editada'}
                >
                  {showingEdited ? (
                    <Images className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              )}

              <div className="p-2">
                <p className="truncate text-xs text-muted-foreground" title={foto.rawFileName}>
                  {showingEdited && foto.editedFileName ? foto.editedFileName : foto.rawFileName}
                </p>
                <div className="mt-1 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDownloadRaw(foto.id)}
                    title="Baixar RAW"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {foto.editedDownloadUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDownloadEdited(foto.id)}
                      title="Baixar Editada"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-500" />
                    </Button>
                  )}
                  {onReorder && (
                    <div className="ml-auto flex gap-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-6"
                        onClick={() => mover(foto.id, -1)}
                        disabled={index === 0}
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-6"
                        onClick={() => mover(foto.id, 1)}
                        disabled={index === fotos.length - 1}
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(foto.id)}
                      title="Remover foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
