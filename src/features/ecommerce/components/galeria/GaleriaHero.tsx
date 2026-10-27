import { Heart, MapPin } from 'lucide-react'
import type { FotoEnsaio } from '../../types/ecommerce.types'

interface GaleriaHeroProps {
  foto: FotoEnsaio | null
  capaUrl?: string | null
  titulo: string | null
  dataHoraEnsaio: string
  localEnsaio: string | null
  onExplore: () => void
}

function formatarDataEnsaio(valor: string): string {
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data)
}

export function GaleriaHero({
  foto,
  capaUrl,
  titulo,
  dataHoraEnsaio,
  localEnsaio,
  onExplore,
}: GaleriaHeroProps) {
  const dataFormatada = formatarDataEnsaio(dataHoraEnsaio)
  const tituloExibicao = titulo?.trim() || 'Sua galeria'
  const url = capaUrl || foto?.watermarkedUrl || null

  return (
    <section className="relative h-[68dvh] min-h-[460px] max-h-[780px] w-full overflow-hidden bg-gallery-ink sm:h-[78dvh]">
      {url ? (
        <img
          key={url}
          src={url}
          alt=""
          fetchPriority="high"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute inset-0 h-full w-full select-none scale-[1.04] object-cover object-[center_25%] opacity-0 animate-[gallery-hero-in_1.1s_ease-out_forwards] [-webkit-touch-callout:none] motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:animate-none"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a3129] via-[#211d19] to-[#4a3a2c]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/65" />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 pb-24 pt-24 text-center text-white sm:px-8">
        <p className="text-[10px] uppercase tracking-[0.42em] text-white/75 sm:text-[11px]">
          Sua galeria
        </p>
        <h1 className="mt-4 max-w-4xl text-balance font-display text-4xl uppercase leading-[1.05] tracking-[0.04em] drop-shadow-[0_2px_24px_rgba(0,0,0,0.4)] sm:text-6xl lg:text-7xl">
          {tituloExibicao}
        </h1>
        <div className="mt-5 flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-[0.26em] text-white/80 sm:text-[11px]">
          {dataFormatada && <span>{dataFormatada}</span>}
          {localEnsaio && (
            <span className="flex max-w-[85vw] items-center gap-1.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{localEnsaio}</span>
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onExplore}
        className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent sm:bottom-7"
        aria-label="Ir para as fotos da galeria"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/40 backdrop-blur motion-safe:animate-[gallery-heart-pulse_2.8s_ease-in-out_infinite] motion-reduce:animate-none">
          <Heart className="h-5 w-5" fill="currentColor" aria-hidden="true" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/80">
          Aproveite!
        </span>
      </button>
    </section>
  )
}
