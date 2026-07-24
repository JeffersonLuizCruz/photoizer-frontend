import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { EdicaoUploader } from '../components/EdicaoUploader'
import { edicaoService } from '../services/edicao.service'

export function UploadRawPage() {
  const { agendamentoId } = useParams<{ agendamentoId: string }>()
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleUpload = useCallback(async () => {
    if (!agendamentoId || files.length === 0) return

    setIsUploading(true)
    setProgress(0)

    try {
      await edicaoService.uploadRawWithProgress(agendamentoId, files, (p) => setProgress(p))
      toast.success(`${files.length} foto(s) RAW enviada(s) com sucesso`)
      navigate(`/edicao/${agendamentoId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar fotos')
    } finally {
      setIsUploading(false)
    }
  }, [agendamentoId, files, navigate])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/edicao">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageTitle
          title="Upload de Fotos RAW"
          description="Selecione as fotos do ensaio para enviar ao editor"
        />
      </div>

      <EdicaoUploader
        multiple
        label="Arraste as fotos RAW ou clique para selecionar"
        onFilesChange={setFiles}
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadProgress={progress}
      />

      {!isUploading && files.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Total: {files.length} arquivo(s) selecionado(s)
        </p>
      )}
    </div>
  )
}
