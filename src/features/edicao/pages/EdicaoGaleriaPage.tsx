import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Download, Upload, CheckCircle2, Store, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { PageLoading } from '@/shared/components/layout/Loading'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { EdicaoStatusBadge } from '../components/EdicaoStatusBadge'
import { EdicaoGaleriaGrid } from '../components/EdicaoGaleriaGrid'
import { EdicaoUploader } from '../components/EdicaoUploader'
import { useEdicaoStatus, useEdicaoFotos, useUploadEditadas, useConcluirEdicao, usePublicarNoEcommerce, useDeleteFoto, useAtualizarObservacoes, useReordenarFotos } from '../api/queries'

export function EdicaoGaleriaPage() {
  const { agendamentoId } = useParams<{ agendamentoId: string }>()
  const navigate = useNavigate()

  const { data: edicao, isLoading: statusLoading } = useEdicaoStatus(agendamentoId!)
  const { data: fotos, isLoading: fotosLoading } = useEdicaoFotos(agendamentoId!)
  const { mutate: uploadEditadas, isPending: isUploading } = useUploadEditadas(agendamentoId!)
  const { mutate: concluir, isPending: isConcluding } = useConcluirEdicao(agendamentoId!)
  const { mutate: publicar, isPending: isPublishing } = usePublicarNoEcommerce(agendamentoId!)
  const { mutate: deletarFoto, isPending: isDeleting } = useDeleteFoto(agendamentoId!)

  const [editFiles, setEditFiles] = useState<File[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const { mutate: salvarObservacoes, isPending: savingObs } = useAtualizarObservacoes(agendamentoId!)
  const { mutate: reordenar } = useReordenarFotos(agendamentoId!)
  const obsRef = useRef('')

  useEffect(() => {
    if (edicao?.observacoes != null) {
      setObservacoes(edicao.observacoes)
      obsRef.current = edicao.observacoes
    }
  }, [edicao?.observacoes])

  if (statusLoading || fotosLoading) return <PageLoading />

  if (!edicao) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Nenhum processo de edição encontrado para este ensaio.
        </p>
        <Button className="mt-4" onClick={() => navigate('/edicao')}>
          Voltar para Edição
        </Button>
      </div>
    )
  }

  const totalRaw = fotos?.filter((f) => f.status === 'RAW').length ?? 0
  const totalEditadas = fotos?.filter((f) => f.status === 'EDITADO').length ?? 0
  const podeConcluir = totalEditadas > 0 && edicao.status !== 'EDICAO_CONCLUIDA'
  const podePublicar = edicao.status === 'EDICAO_CONCLUIDA'

  function handleUploadEdit() {
    if (!agendamentoId || editFiles.length === 0) return
    uploadEditadas(editFiles, {
      onSuccess: () => {
        setEditFiles([])
        setShowUpload(false)
      },
    })
  }

  function handleDownloadZip() {
    if (!agendamentoId) return
    const link = document.createElement('a')
    link.href = `/api/v1/edicao/${agendamentoId}/download-raw`
    link.download = `raw_${agendamentoId}.zip`
    link.click()
  }

  function handleDownloadEditedZip() {
    if (!agendamentoId) return
    const link = document.createElement('a')
    link.href = `/api/v1/edicao/${agendamentoId}/download-editadas`
    link.download = `editadas_${agendamentoId}.zip`
    link.click()
  }

  function handleDownloadRaw(fotoId: string) {
    const link = document.createElement('a')
    link.href = `/api/v1/edicao/fotos/${fotoId}/raw`
    link.download = ''
    link.click()
  }

  function handleDownloadEdited(fotoId: string) {
    const link = document.createElement('a')
    link.href = `/api/v1/edicao/fotos/${fotoId}/edited`
    link.download = ''
    link.click()
  }

  function handleDeleteFoto(fotoId: string) {
    deletarFoto(fotoId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/edicao">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageTitle
            title={`Workspace de Edição`}
            description={`Ensaio #${agendamentoId?.substring(0, 8)}`}
          />
        </div>
        <EdicaoStatusBadge status={edicao.status} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">RAW:</span>
          <span className="font-medium">{totalRaw}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Editadas:</span>
          <span className="font-medium">{totalEditadas}</span>
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadZip}>
            <Download className="mr-1 h-4 w-4" />
            ZIP RAW
          </Button>

          {totalEditadas > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadEditedZip}>
              <Download className="mr-1 h-4 w-4" />
              ZIP Editadas
            </Button>
          )}

          {edicao.status !== 'EDICAO_CONCLUIDA' && (
            <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
              <Upload className="mr-1 h-4 w-4" />
              Upload Editadas
            </Button>
          )}

          {podeConcluir && (
            <Button
              size="sm"
              onClick={() => concluir()}
              disabled={isConcluding}
            >
              {isConcluding ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-4 w-4" />
              )}
              Concluir Edição
            </Button>
          )}

          {podePublicar && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={isPublishing}>
                  {isPublishing ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Store className="mr-1 h-4 w-4" />
                  )}
                  Publicar no Ecommerce
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publicar no Ecommerce?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá gerar as versões com marca d'água e thumbnail para cada foto editada
                    e disponibilizá-las no ecommerce para o cliente. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => publicar()}>
                    Publicar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium">Observações para o editor</label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções sobre o estilo de edição, correções necessárias, etc."
              className="mt-1 min-h-[60px]"
              disabled={edicao.status === 'EDICAO_CONCLUIDA'}
            />
          </div>
          <Button
            size="sm"
            className="mt-6 shrink-0"
            onClick={() => salvarObservacoes(observacoes)}
            disabled={savingObs || observacoes === obsRef.current || edicao.status === 'EDICAO_CONCLUIDA'}
          >
            {savingObs ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {showUpload && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Upload de Fotos Editadas</h3>
          <EdicaoUploader
            multiple
            label="Arraste as fotos editadas ou clique para selecionar"
            onFilesChange={setEditFiles}
            onUpload={handleUploadEdit}
            isUploading={isUploading}
          />
        </div>
      )}

      {!fotos && fotosLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border bg-card">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-2">
                <Skeleton className="h-3 w-3/4" />
                <div className="mt-2 flex gap-1">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {fotos && (
        <EdicaoGaleriaGrid
          fotos={fotos}
          onDownloadRaw={handleDownloadRaw}
          onDownloadEdited={handleDownloadEdited}
          onDelete={edicao.status !== 'EDICAO_CONCLUIDA' ? handleDeleteFoto : undefined}
          onReorder={edicao.status !== 'EDICAO_CONCLUIDA' ? reordenar : undefined}
        />
      )}
    </div>
  )
}
