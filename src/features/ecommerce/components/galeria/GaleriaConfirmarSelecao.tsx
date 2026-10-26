import { Check, Loader2, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import type { FotoEnsaio } from '../../types/ecommerce.types'
import { numeroGaleriaLabel } from '@/shared/lib/foto'

interface GaleriaConfirmarSelecaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacoteFotos: FotoEnsaio[]
  extrasFotos: FotoEnsaio[]
  observacao: string
  onObservacaoChange: (valor: string) => void
  totalExtras: number
  onConfirm: () => void
  isLoading: boolean
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Miniaturas({ fotos }: { fotos: FotoEnsaio[] }) {
  if (fotos.length === 0) return null
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
      {fotos.map((foto) => (
        <div key={foto.id} className="relative overflow-hidden rounded-[2px] bg-gallery-line/40">
          <img src={foto.thumbUrl} alt={foto.fileName} className="aspect-[3/2] w-full object-cover" />
          {foto.numeroGaleria != null && (
            <span className="absolute left-1 top-1 rounded-sm bg-gallery-ink/60 px-1 py-0.5 text-[9px] font-medium tabular-nums text-white backdrop-blur">
              {numeroGaleriaLabel(foto.numeroGaleria)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function GaleriaConfirmarSelecao({
  open,
  onOpenChange,
  pacoteFotos,
  extrasFotos,
  observacao,
  onObservacaoChange,
  totalExtras,
  onConfirm,
  isLoading,
}: GaleriaConfirmarSelecaoProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        hideClose
        className="h-dvh max-h-none w-full gap-0 overflow-hidden border-gallery-line bg-gallery-bg p-0 sm:h-full sm:max-w-md"
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-gallery-line px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <SheetTitle className="font-display text-lg text-gallery-ink">
            Enviar sua seleção
          </SheetTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gallery-surface text-gallery-ink ring-1 ring-gallery-line transition-colors hover:bg-gallery-line/40"
            aria-label="Fechar confirmação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <p className="text-sm leading-relaxed text-gallery-muted">
            Confira suas escolhas. Depois do envio, a seleção ficará bloqueada
            enquanto o estúdio prepara a edição.
          </p>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gallery-ink">
              <Check className="h-3.5 w-3.5 text-gallery-accent" />
              Fotos do pacote ({pacoteFotos.length})
            </h3>
            <Miniaturas fotos={pacoteFotos} />
          </section>

          {extrasFotos.length > 0 && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gallery-ink">
                Extras da seleção ({extrasFotos.length})
              </h3>
              <Miniaturas fotos={extrasFotos} />
              <p className="mt-2 text-xs text-gallery-muted">
                Valor estimado dos extras: <strong className="font-medium text-gallery-ink">{formatBRL(totalExtras)}</strong>
              </p>
            </section>
          )}

          <section>
            <label
              htmlFor="observacao-selecao"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gallery-ink"
            >
              Recado para o estúdio (opcional)
            </label>
            <textarea
              id="observacao-selecao"
              value={observacao}
              onChange={(e) => onObservacaoChange(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ex.: gostaria de manter essa foto mais natural..."
              className="mt-2 w-full resize-none rounded-sm border border-gallery-line bg-gallery-surface px-3 py-2.5 text-sm text-gallery-ink outline-none placeholder:text-gallery-muted/70 focus:ring-2 focus:ring-gallery-accent/40"
            />
          </section>
        </div>

        <div className="shrink-0 border-t border-gallery-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onConfirm}
            disabled={isLoading || pacoteFotos.length === 0}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gallery-ink px-5 text-sm font-semibold text-gallery-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isLoading ? 'Enviando...' : 'Enviar seleção'}
          </button>
          <p className="mt-2 text-center text-[11px] text-gallery-muted">
            Você poderá acompanhar o andamento por aqui.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
