import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Trash2, Send, ImagePlus, X, Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { ROUTES } from '@/shared/constants'
import { fotoService } from '../services/foto.service'
import { useFotosList, useUploadFotos, usePublicarFotos, useDeletarFoto } from '../api/queries'

export function AdminGaleriaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [galeriaLink, setGaleriaLink] = useState<string | null>(null)

  const { data: fotos = [], isLoading } = useFotosList(id)
  const { mutate: uploadFotos, isPending: isUploading } = useUploadFotos(id ?? '')
  const { mutate: publicar, isPending: isPublishing } = usePublicarFotos(id ?? '')
  const { mutate: deletar } = useDeletarFoto(id ?? '')

  useEffect(() => {
    if (!id) return
    fotoService.getAgendamento(id).then((a) => {
      if (a.tokenGaleria) {
        setGaleriaLink(`${window.location.origin}/g/${a.tokenGaleria}`)
      }
    }).catch(() => {})
  }, [id])

  if (!id) return <PageLoading />

  const ineditas = fotos.filter((f) => f.status === 'INEDITA').length
  const publicadas = fotos.filter((f) => f.status === 'PUBLICADA').length

  const handleUpload = () => {
    if (selectedFiles.length === 0) return
    uploadFotos(selectedFiles, {
      onSuccess: () => setSelectedFiles([]),
    })
  }

  const allPublished = fotos.length > 0 && fotos.every((f) => f.status === 'PUBLICADA')

  const copiarLink = () => {
    if (galeriaLink) {
      navigator.clipboard.writeText(galeriaLink)
      toast.success('Link da galeria copiado!')
    }
  }

  return (
    <div>
      <PageTitle
        title="Galeria de Fotos"
        breadcrumbs={[
          { label: 'Agenda', href: ROUTES.AGENDA },
          { label: 'Detalhes', href: `/agenda/${id}` },
          { label: 'Fotos' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {galeriaLink && (
              <Button variant="outline" size="sm" onClick={copiarLink}>
                <Link2 className="mr-1 h-4 w-4" />
                Copiar Link
              </Button>
            )}
            {fotos.length > 0 && !allPublished && (
              <Button onClick={() => publicar()} disabled={isPublishing} variant="default" size="sm">
                {isPublishing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                Publicar Galeria
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${id}`)}>
              Voltar
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <ImagePlus className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Clique para selecionar fotos</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG — múltiplos arquivos</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) setSelectedFiles(Array.from(e.target.files))
              }}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-16 w-16 rounded-md object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{selectedFiles.length} arquivo(s) selecionado(s)</p>
                <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-1 h-4 w-4" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Total: <strong>{fotos.length}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Inéditas: <strong className="text-amber-600">{ineditas}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Publicadas: <strong className="text-emerald-600">{publicadas}</strong></span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/2] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : fotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ImagePlus className="mb-2 h-8 w-8" />
            <p className="text-sm">Nenhuma foto enviada ainda</p>
            <p className="text-xs mt-1">Use o campo acima para fazer upload</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {fotos.map((foto) => (
              <div key={foto.id} className="group relative rounded-lg border bg-card overflow-hidden">
                <div className="aspect-[3/2] relative">
                  <img
                    src={foto.thumbUrl}
                    alt={foto.fileName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => deletar(foto.id)}
                      className="h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs truncate text-muted-foreground">{foto.fileName}</p>
                  <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                    foto.status === 'PUBLICADA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    foto.status === 'INEDITA' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {foto.status === 'PUBLICADA' ? 'Publicada' : foto.status === 'INEDITA' ? 'Inédita' : foto.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
