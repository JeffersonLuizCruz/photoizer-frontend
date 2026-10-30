import { useState } from 'react'
import { Image as ImageIcon, ImageOff, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/cn'
import { fotoStaffThumbUrl, numeroGaleriaLabel } from '@/shared/lib/foto'
import { useDefinirCapaGaleria } from '../../api/queries'
import type { FotoEnsaio } from '@/features/ecommerce/types/ecommerce.types'

function podeSerCapa(foto: FotoEnsaio): boolean {
  return !foto.arquivosRemovidos
    && foto.visivel
    && (foto.status === 'PUBLICADA' || foto.status === 'PAGA')
}

interface GaleriaCapaCardProps {
  agendamentoId: string
  fotos: FotoEnsaio[]
  capaFotoId: string | null | undefined
  arquivada: boolean
  onVerGrade: () => void
}

export function GaleriaCapaCard({
  agendamentoId,
  fotos,
  capaFotoId,
  arquivada,
  onVerGrade,
}: GaleriaCapaCardProps) {
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const { mutate: definirCapa, isPending } = useDefinirCapaGaleria(agendamentoId)

  const capaAtual = capaFotoId
    ? fotos.find((foto) => foto.id === capaFotoId) ?? null
    : null
  const temCapa = Boolean(capaFotoId)
  const elegiveis = fotos.filter(podeSerCapa)

  const escolherCapa = (fotoId: string) => {
    definirCapa(fotoId, { onSuccess: () => setDialogoAberto(false) })
  }

  return (
    <section className="flex flex-col rounded-xl border bg-card p-4" aria-labelledby="galeria-capa-titulo">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ImageIcon className="h-4 w-4" />
        </div>
        <div>
          <h3 id="galeria-capa-titulo" className="text-sm font-semibold">Capa da galeria</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Foto exibida no topo da galeria do cliente.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border bg-muted sm:w-40">
          {capaAtual ? (
            <AuthImage
              src={fotoStaffThumbUrl(capaAtual, agendamentoId)}
              alt="Capa atual da galeria"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageOff className="h-6 w-6" />
              <span className="text-[11px]">{temCapa ? 'Arquivo expurgado' : 'Sem capa'}</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {capaAtual
              ? 'Capa publicada. Você pode trocar ou remover a qualquer momento.'
              : temCapa
                ? 'Capa definida, mas o arquivo original foi expurgado.'
                : elegiveis.length > 0
                  ? `${elegiveis.length} foto(s) disponível(is) para capa.`
                  : 'Publique fotos para escolher uma capa.'}
          </p>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogoAberto(true)}
              disabled={isPending || elegiveis.length === 0}
              title={elegiveis.length === 0 ? 'Publique fotos para escolher a capa' : undefined}
            >
              {isPending
                ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                : <ImageIcon className="mr-1 h-4 w-4" />}
              {capaAtual ? 'Trocar capa' : 'Escolher capa'}
            </Button>
            {temCapa && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => definirCapa(null)}
                disabled={isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remover capa
              </Button>
            )}
          </div>

          {!arquivada && elegiveis.length === 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto justify-start px-0 text-xs"
              onClick={onVerGrade}
            >
              Ver fotos da galeria
            </Button>
          )}
        </div>
      </div>

      {arquivada && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Galeria arquivada: os arquivos das fotos foram expurgados.
        </p>
      )}

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Escolher capa</DialogTitle>
            <DialogDescription>
              Selecione a foto que deve aparecer no topo da galeria do cliente. Apenas fotos
              visíveis e publicadas podem ser usadas.
            </DialogDescription>
          </DialogHeader>

          {elegiveis.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma foto publicada disponível para capa.
            </div>
          ) : (
            <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
              {elegiveis.map((foto) => {
                const selecionada = foto.id === capaFotoId
                return (
                  <button
                    key={foto.id}
                    type="button"
                    onClick={() => escolherCapa(foto.id)}
                    disabled={isPending}
                    aria-pressed={selecionada}
                    aria-label={`Usar ${numeroGaleriaLabel(foto.numeroGaleria) || foto.fileName} como capa`}
                    className={cn(
                      'group relative overflow-hidden rounded-lg border bg-muted text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                      selecionada
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background'
                        : 'hover:border-primary/60',
                    )}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <AuthImage
                        src={fotoStaffThumbUrl(foto, agendamentoId)}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
                      {numeroGaleriaLabel(foto.numeroGaleria) || foto.fileName}
                    </span>
                    {selecionada && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-amber-950">
                        Capa atual
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
