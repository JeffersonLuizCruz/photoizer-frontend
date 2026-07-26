import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ExternalLink, Store, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { PageLoading } from '@/shared/components/layout/Loading'
import { useEdicaoStatus, useEdicaoFotos, useRevisarFoto, usePublicarLoja } from '../api/queries'
import { EdicaoRevisaoGrid } from '../components/EdicaoRevisaoGrid'

export function EdicaoRevisaoPage() {
  const { agendamentoId } = useParams<{ agendamentoId: string }>()
  const navigate = useNavigate()
  const [publishing, setPublishing] = useState(false)

  const { data: edicao, isLoading: statusLoading } = useEdicaoStatus(agendamentoId!)
  const { data: fotos, isLoading: fotosLoading } = useEdicaoFotos(agendamentoId!)
  const { mutateAsync: revisar, isPending: isSaving } = useRevisarFoto(agendamentoId!)
  const { mutateAsync: publicarLoja } = usePublicarLoja(agendamentoId!)

  if (statusLoading || fotosLoading) return <PageLoading />

  const fotosAprovadas = fotos?.filter((f) => f.aprovado === true) ?? []
  const totalAprovadas = fotosAprovadas.length

  async function handlePublicar() {
    const confirmar = window.confirm(
      `${totalAprovadas} foto${totalAprovadas > 1 ? 's' : ''} aprovada${totalAprovadas > 1 ? 's' : ''} será${totalAprovadas === 1 ? 'á' : 'ão'} publicada${totalAprovadas > 1 ? 's' : ''} na loja virtual. Os clientes poderão ver e comprar as fotos. Deseja continuar?`,
    )
    if (!confirmar) return

    setPublishing(true)
    try {
      await publicarLoja()
      navigate('/edicao')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/edicao')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Revisão de Fotos</h1>
          {edicao && (
            <p className="text-sm text-muted-foreground">
              Ensaio #{agendamentoId!.substring(0, 8)}
              {edicao.fotografoNome && ` — Fotógrafo: ${edicao.fotografoNome}`}
              {edicao.editorNome && ` — Editor: ${edicao.editorNome}`}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-500" />
        Compare a foto original com a editada e aprove ou rejeite cada foto.
        Após revisar todas, clique em <strong>Publicar na Loja Virtual</strong> para disponibilizar as fotos aprovadas para seus clientes.
      </div>

      {!fotos || fotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <CheckCircle2 className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">Nenhuma foto para revisar</p>
          <p className="mt-1 text-sm">As fotos editadas aparecerão aqui.</p>
        </div>
      ) : (
        <>
          <EdicaoRevisaoGrid
            fotos={fotos}
            isSaving={isSaving}
            onSalvar={async (fotoId, aprovado, comentario) => {
              await revisar({ fotoId, aprovado, comentario })
              if (aprovado === true) {
                toast.success('Foto aprovada e enviada para a galeria')
              } else {
                toast.success('Revisão salva')
              }
            }}
          />

          <div className="sticky bottom-4 z-10 flex justify-center">
            <Button
              size="lg"
              onClick={handlePublicar}
              disabled={totalAprovadas === 0 || publishing}
              className="shadow-lg"
            >
              {publishing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Store className="mr-2 h-5 w-5" />
              )}
              Publicar na Loja Virtual
              {totalAprovadas > 0 && ` (${totalAprovadas})`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
