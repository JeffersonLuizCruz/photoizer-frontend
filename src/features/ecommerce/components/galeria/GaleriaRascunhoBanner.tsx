import { RotateCcw } from 'lucide-react'

interface GaleriaRascunhoBannerProps {
  fotosNoPacote: number
  extrasNoCarrinho: number
  onLimparPacote: () => void
}

/**
 * Aviso exibido quando o estúdio reabre uma seleção já enviada.
 *
 * O backend preserva `selecionadaPacote`, então as escolhas anteriores voltam
 * como rascunho editável. Os extras do carrinho não são afetados.
 */
export function GaleriaRascunhoBanner({
  fotosNoPacote,
  extrasNoCarrinho,
  onLimparPacote,
}: GaleriaRascunhoBannerProps) {
  return (
    <div className="mx-auto mt-8 w-full max-w-xl px-4">
      <div className="rounded-sm border border-gallery-accent/40 bg-gallery-surface px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gallery-accent/10 text-gallery-accent">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gallery-ink">
              Sua seleção foi reaberta
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gallery-muted">
              {fotosNoPacote === 0
                ? 'Escolha as fotos do pacote novamente e envie a seleção.'
                : fotosNoPacote === 1
                  ? 'A foto do pacote continua marcada como rascunho. Ajuste o que quiser e envie novamente.'
                  : `As ${fotosNoPacote} fotos do pacote continuam marcadas como rascunho. Ajuste o que quiser e envie novamente.`}
            </p>
            {extrasNoCarrinho > 0 && (
              <p className="mt-1 text-xs leading-relaxed text-gallery-muted">
                {extrasNoCarrinho === 1
                  ? 'Seu extra no carrinho foi mantido.'
                  : `Seus ${extrasNoCarrinho} extras no carrinho foram mantidos.`}
              </p>
            )}
            {fotosNoPacote > 0 && (
              <button
                type="button"
                onClick={onLimparPacote}
                className="mt-3 rounded-full border border-gallery-line px-3.5 py-2 text-[11px] font-medium text-gallery-ink transition-colors hover:bg-gallery-line/40"
              >
                Limpar fotos do pacote
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
