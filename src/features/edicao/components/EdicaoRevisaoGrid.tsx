import { useState, useCallback } from 'react'
import { ThumbsUp, ThumbsDown, Save, MessageSquare } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { cn } from '@/shared/lib/cn'
import type { FotoEdicao } from '../types'

interface RevisaoState {
  aprovado: boolean | null
  comentario: string
}

interface EdicaoRevisaoGridProps {
  fotos: FotoEdicao[]
  onSalvar: (fotoId: string, aprovado: boolean | null, comentario: string | null) => Promise<void>
  isSaving: boolean
}

export function EdicaoRevisaoGrid({ fotos, onSalvar, isSaving }: EdicaoRevisaoGridProps) {
  const [revisoes, setRevisoes] = useState<Record<string, RevisaoState>>(() => {
    const initial: Record<string, RevisaoState> = {}
    for (const foto of fotos) {
      initial[foto.id] = {
        aprovado: foto.aprovado,
        comentario: foto.comentario ?? '',
      }
    }
    return initial
  })

  const [dirty, setDirty] = useState<Set<string>>(new Set())

  const atualizar = useCallback((fotoId: string, updates: Partial<RevisaoState>) => {
    setRevisoes((prev) => ({
      ...prev,
      [fotoId]: { ...prev[fotoId], ...updates },
    }))
    setDirty((prev) => new Set(prev).add(fotoId))
  }, [])

  const salvarFoto = useCallback(
    async (fotoId: string) => {
      const r = revisoes[fotoId]
      await onSalvar(fotoId, r.aprovado, r.comentario || null)
      setDirty((prev) => {
        const next = new Set(prev)
        next.delete(fotoId)
        return next
      })
    },
    [revisoes, onSalvar],
  )

  const salvarTodas = useCallback(async () => {
    await Promise.all(
      [...dirty].map((fotoId) => {
        const r = revisoes[fotoId]
        return onSalvar(fotoId, r.aprovado, r.comentario || null)
      }),
    )
    setDirty(new Set())
  }, [dirty, revisoes, onSalvar])

  const fotosOrdenadas = [...fotos].sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="space-y-8">
      {fotosOrdenadas.map((foto) => {
        const revisao = revisoes[foto.id]
        const isDirty = dirty.has(foto.id)
        return (
          <div
            key={foto.id}
            className={cn(
              'rounded-lg border bg-card transition-shadow',
              isDirty && 'ring-2 ring-primary/30',
            )}
          >
            <div className="flex flex-col gap-4 p-4 md:flex-row">
              <div className="flex-1">
                <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                  Original (RAW)
                </p>
                <div className="overflow-hidden rounded-lg bg-muted">
                  <AuthImage
                    src={foto.rawPreviewUrl}
                    alt={foto.rawFileName}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="mb-2 text-center text-xs font-medium text-emerald-600">
                  Editada
                </p>
                <div className="overflow-hidden rounded-lg bg-muted">
                  <AuthImage
                    src={foto.editedPreviewUrl ?? foto.rawPreviewUrl}
                    alt={foto.editedFileName ?? foto.rawFileName}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="border-t px-4 py-3">
              <p className="mb-3 truncate text-sm font-medium">
                {foto.rawFileName}
              </p>

              <div className="mb-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    atualizar(foto.id, {
                      aprovado: revisao.aprovado === true ? null : true,
                    })
                  }
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    revisao.aprovado === true
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600',
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Aprovado
                </button>
                <button
                  type="button"
                  onClick={() =>
                    atualizar(foto.id, {
                      aprovado: revisao.aprovado === false ? null : false,
                    })
                  }
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    revisao.aprovado === false
                      ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                      : 'border-border text-muted-foreground hover:border-red-300 hover:text-red-600',
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Rejeitado
                </button>
                {isDirty && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    <Save className="mr-1 inline h-3 w-3" />
                    Não salvo
                  </span>
                )}
              </div>

              <div className="relative">
                <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  value={revisao.comentario}
                  onChange={(e) => atualizar(foto.id, { comentario: e.target.value })}
                  placeholder="Observação sobre esta foto..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {isDirty && (
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => salvarFoto(foto.id)}
                    disabled={isSaving}
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {dirty.size > 0 && (
        <div className="sticky bottom-4 flex justify-center">
          <Button
            size="lg"
            onClick={salvarTodas}
            disabled={isSaving}
            className="shadow-lg"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar revisão ({dirty.size} foto{dirty.size > 1 ? 's' : ''})
          </Button>
        </div>
      )}
    </div>
  )
}
