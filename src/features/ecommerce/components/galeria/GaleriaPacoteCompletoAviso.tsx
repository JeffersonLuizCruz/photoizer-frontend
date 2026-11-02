import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface GaleriaPacoteCompletoAvisoProps {
  onEnviar: () => void
  variante?: 'banner' | 'compact'
  className?: string
}

/**
 * CTA que aparece quando o cliente completa o pacote. No visualizador ele é
 * essencial: o dock com "Enviar seleção" fica atrás do fullscreen.
 */
export function GaleriaPacoteCompletoAviso({
  onEnviar,
  variante = 'banner',
  className,
}: GaleriaPacoteCompletoAvisoProps) {
  const botao = (
    <button
      onClick={onEnviar}
      className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gallery-ink px-4 text-xs font-semibold text-gallery-bg transition-opacity hover:opacity-90 active:scale-[0.98]"
    >
      <Check className="h-3.5 w-3.5" />
      Enviar seleção
    </button>
  )

  if (variante === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-2xl border border-gallery-accent/30 bg-gallery-surface/95 p-3 shadow-md',
        className,
      )}>
        <Sparkles className="h-4 w-4 shrink-0 text-gallery-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gallery-ink">Pacote completo!</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-gallery-muted">
            Envie sua seleção para o estúdio continuar com todo o carinho.
          </p>
        </div>
        {botao}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col gap-3 rounded-2xl border border-gallery-accent/30 bg-gallery-surface/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
      className,
    )}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gallery-bg text-gallery-accent ring-1 ring-gallery-line">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gallery-ink">Pacote completo!</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gallery-muted">
            Que escolha especial! Envie sua seleção para o estúdio continuar com todo o carinho.
          </p>
        </div>
      </div>
      {botao}
    </div>
  )
}
