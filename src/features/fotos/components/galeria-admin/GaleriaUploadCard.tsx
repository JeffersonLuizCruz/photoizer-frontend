import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Send, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { AGENDAMENTO_STATUS, type AgendamentoStatus } from '@/shared/constants'
import { type ModoGaleria } from '@/shared/constants/galeriaModo'
import { cn } from '@/shared/lib/cn'
import { useUploadFotos } from '../../api/queries'
import { UploadLoteError, type AgendamentoRef, type UploadProgress } from '../../services/foto.service'
import { PublicarGaleriaDialog } from './PublicarGaleriaDialog'
import type { FotoEnsaio } from '@/features/ecommerce/types/ecommerce.types'

/** Limite por imagem aceito pelo backend (FileValidator, contexto "image"). */
const LIMITE_ARQUIVO_BYTES = 100 * 1024 * 1024
const TIPOS_ACEITOS = ['image/jpeg', 'image/png']

const STATUS_UPLOAD_LIBERADO: AgendamentoStatus[] = [
  AGENDAMENTO_STATUS.EM_EDICAO,
  AGENDAMENTO_STATUS.FINALIZADO,
]

function arquivoAceito(file: File): boolean {
  return TIPOS_ACEITOS.includes(file.type) || /\.(jpe?g|png)$/i.test(file.name)
}

function formatarMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

interface GaleriaUploadCardProps {
  agendamentoId: string
  agendamento: AgendamentoRef | undefined
  fotos: FotoEnsaio[]
  arquivada: boolean
  modoAtual: ModoGaleria
  onVerGrade: () => void
}

export function GaleriaUploadCard({
  agendamentoId,
  agendamento,
  fotos,
  arquivada,
  modoAtual,
  onVerGrade,
}: GaleriaUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [publicarAberto, setPublicarAberto] = useState(false)

  const { mutate: uploadFotos, isPending: isUploading } = useUploadFotos(agendamentoId)

  // Previews em state + effect: o progresso do upload re-renderiza a tela
  // várias vezes e recriar os object URLs a cada render vazaria memória.
  useEffect(() => {
    const novas = selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviews(novas)
    return () => novas.forEach((preview) => URL.revokeObjectURL(preview.url))
  }, [selectedFiles])

  const uploadLiberado = agendamento
    ? STATUS_UPLOAD_LIBERADO.includes(agendamento.status)
    : false
  const total = fotos.length
  const publicadas = fotos.filter((foto) => foto.status === 'PUBLICADA').length
  const ineditas = fotos.filter((foto) => foto.status === 'INEDITA').length
  // Qualquer foto que saiu de INEDITA já foi publicada alguma vez.
  const fluxoDefinido = fotos.some((foto) => foto.status !== 'INEDITA')

  const percentualUpload = uploadProgress && uploadProgress.totalArquivos > 0
    ? Math.min(100, Math.round(
        ((uploadProgress.arquivosConcluidos + uploadProgress.percentualLote * uploadProgress.arquivosNoLote) /
          uploadProgress.totalArquivos) * 100,
      ))
    : 0

  const adicionarArquivos = (lista: FileList | File[]) => {
    if (isUploading) return

    const arquivos = Array.from(lista)
    const naoAceitos = arquivos.filter((file) => !arquivoAceito(file))
    const aceitos = arquivos.filter(arquivoAceito)
    const acimaDoLimite = aceitos.filter((file) => file.size > LIMITE_ARQUIVO_BYTES)

    if (naoAceitos.length > 0) {
      toast.error(`Formato não aceito: ${naoAceitos.map((file) => file.name).join(', ')}. Use JPG ou PNG.`)
    }
    if (acimaDoLimite.length > 0) {
      toast.error(
        `Arquivo(s) acima de ${formatarMb(LIMITE_ARQUIVO_BYTES)}: ${acimaDoLimite.map((file) => file.name).join(', ')}`,
      )
    }

    const validos = aceitos.filter((file) => file.size <= LIMITE_ARQUIVO_BYTES)
    if (validos.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validos])
    }
  }

  const handleUpload = () => {
    if (selectedFiles.length === 0 || isUploading) return

    setUploadProgress(null)
    uploadFotos(
      { arquivos: selectedFiles, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          setSelectedFiles([])
          setUploadProgress(null)
        },
        onError: (error) => {
          setUploadProgress(null)
          // Mantém selecionados apenas os arquivos que ainda não foram enviados.
          if (error instanceof UploadLoteError) {
            setSelectedFiles(error.restantes)
          }
        },
      },
    )
  }

  const removerSelecionado = (indice: number) => {
    if (isUploading) return
    setSelectedFiles((prev) => prev.filter((_, posicao) => posicao !== indice))
  }

  return (
    <section className="rounded-xl border bg-card p-4" aria-labelledby="galeria-upload-titulo">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) adicionarArquivos(event.target.files)
          event.target.value = ''
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <h3 id="galeria-upload-titulo" className="text-sm font-semibold">Fotos da galeria</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Envie as fotos do ensaio e publique quando estiverem prontas para o cliente.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Total: <strong className="text-foreground tabular-nums">{total}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Publicadas: <strong className="text-emerald-600 tabular-nums">{publicadas}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Inéditas: <strong className="text-amber-600 tabular-nums">{ineditas}</strong></span>
        </div>
      </div>

      {arquivada ? (
        <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Os arquivos desta galeria foram expurgados para liberar espaço. O upload está indisponível.
        </div>
      ) : !uploadLiberado ? (
        <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Upload indisponível</p>
          <p className="mt-1 text-xs">
            O envio de fotos é liberado quando o ensaio entra em edição ou é finalizado.
          </p>
        </div>
      ) : (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Selecionar fotos para enviar"
            aria-disabled={isUploading}
            onClick={() => { if (!isUploading) inputRef.current?.click() }}
            onKeyDown={(event) => {
              if (isUploading) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              if (!isUploading) setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(event) => {
              event.preventDefault()
              setArrastando(false)
              adicionarArquivos(event.dataTransfer.files)
            }}
            className={cn(
              'mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-7',
              isUploading && 'cursor-not-allowed opacity-60',
              arrastando
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            <ImagePlus className="mb-2 h-9 w-9 text-muted-foreground" />
            <p className="text-sm font-medium">
              Arraste as fotos aqui ou clique para selecionar
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG — múltiplos arquivos · até {formatarMb(LIMITE_ARQUIVO_BYTES)} cada
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {previews.slice(0, 12).map(({ file, url }, indice) => (
                  <div key={`${file.name}-${file.size}-${indice}`} className="group relative">
                    <img
                      src={url}
                      alt={file.name}
                      className="h-16 w-16 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => removerSelecionado(indice)}
                      aria-label={`Remover ${file.name}`}
                      className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground disabled:pointer-events-none disabled:opacity-40 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {previews.length > 12 && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground">
                    +{previews.length - 12}
                  </div>
                )}
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {uploadProgress
                        ? `Enviando lote ${uploadProgress.loteAtual}/${uploadProgress.totalLotes} — ${uploadProgress.arquivosConcluidos} de ${uploadProgress.totalArquivos} foto(s)`
                        : 'Preparando envio…'}
                    </span>
                    <span className="font-medium tabular-nums">{percentualUpload}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percentualUpload}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles.length} arquivo(s) selecionado(s)
                  </p>
                  <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                    <Upload className="mr-1 h-4 w-4" />
                    Enviar fotos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    disabled={isUploading}
                  >
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
        <Button variant="outline" size="sm" onClick={onVerGrade}>
          Ver grade de fotos
        </Button>
        {!arquivada && uploadLiberado && ineditas > 0 && (
          <Button
            size="sm"
            onClick={() => setPublicarAberto(true)}
            disabled={isUploading}
          >
            <Send className="mr-1 h-4 w-4" />
            Publicar {ineditas} foto(s)
          </Button>
        )}
      </div>

      <PublicarGaleriaDialog
        agendamentoId={agendamentoId}
        open={publicarAberto}
        onOpenChange={setPublicarAberto}
        quantidade={ineditas}
        modoAtual={modoAtual}
        fluxoDefinido={fluxoDefinido}
      />
    </section>
  )
}
