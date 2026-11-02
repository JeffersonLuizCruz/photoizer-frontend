import { Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DIAS_RETENCAO_FOTOS } from '../../lib/retencao'

type VarianteAviso = 'card' | 'inline' | 'compact'

interface GaleriaAvisoRetencaoProps {
  variante?: VarianteAviso
  className?: string
}

/**
 * Lembrete carinhoso de que as fotos ficam guardadas por 15 dias após o
 * download. É comunicação da política do estúdio: o expurgo continua manual.
 */
export function GaleriaAvisoRetencao({
  variante = 'card',
  className,
}: GaleriaAvisoRetencaoProps) {
  const dias = (
    <strong className="font-semibold text-gallery-ink">
      {DIAS_RETENCAO_FOTOS} dias
    </strong>
  )

  if (variante === 'compact') {
    return (
      <p className={cn('flex items-start gap-1.5 text-[11px] leading-relaxed text-gallery-muted', className)}>
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gallery-accent" aria-hidden="true" />
        <span>
          Suas fotos estarão disponíveis para download durante {dias}.
          Depois desse período, a galeria será encerrada.
        </span>
      </p>
    )
  }

  if (variante === 'inline') {
    return (
      <p className={cn('flex items-start gap-2 text-xs leading-relaxed text-gallery-muted', className)}>
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gallery-accent" aria-hidden="true" />
        <span>
          💖 Suas fotos estarão disponíveis para download durante {dias}.
          Aproveite para guardar suas lembranças; depois desse período, a galeria será encerrada.
        </span>
      </p>
    )
  }

  return (
    <div className={cn(
      'rounded-2xl border border-gallery-line bg-gallery-surface/85 p-4 text-left',
      className,
    )}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gallery-bg text-gallery-accent ring-1 ring-gallery-line">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-gallery-ink">
            💖 Guarde suas lembranças com carinho!
          </p>
          <p className="text-xs leading-relaxed text-gallery-muted">
            Foi um prazer registrar momentos tão especiais para você!
          </p>
          <p className="text-xs leading-relaxed text-gallery-muted">
            Suas fotos estarão disponíveis para download durante {dias}.
            Aproveite esse tempinho para baixar suas imagens e guardar essas lembranças tão preciosas.
          </p>
          <p className="text-xs leading-relaxed text-gallery-muted">
            Após esse período, a galeria será encerrada e as fotos não estarão mais disponíveis para download.
          </p>
          <p className="text-xs font-medium text-gallery-ink">
            Com muito carinho,
          </p>
          <p className="font-display text-sm font-semibold tracking-wide text-gallery-accent">
            Ranny Amaral
          </p>
        </div>
      </div>
    </div>
  )
}
