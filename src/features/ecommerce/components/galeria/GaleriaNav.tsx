import { useEffect, useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface GaleriaNavProps {
  favoritos: number
  carrinho: number
  onFavoritos: () => void
  onCarrinho: () => void
}

function scrollParaTopo() {
  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' })
}

export function GaleriaNav({ favoritos, carrinho, onFavoritos, onCarrinho }: GaleriaNavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const aoRolar = () => setScrolled(window.scrollY > 48)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  const acao = cn(
    'relative flex h-11 w-11 items-center justify-center rounded-full ring-1 backdrop-blur transition-colors',
    scrolled
      ? 'bg-gallery-surface/80 text-gallery-ink ring-gallery-line hover:bg-gallery-surface'
      : 'bg-white/10 text-white ring-white/30 hover:bg-white/20',
  )

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        scrolled
          ? 'border-b border-gallery-line bg-gallery-bg/90 text-gallery-ink shadow-[0_1px_24px_rgba(33,29,25,0.06)] backdrop-blur'
          : 'text-white',
      )}
    >
      <div className="flex h-14 items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] sm:px-6">
        <button
          onClick={scrollParaTopo}
          className="min-w-0 truncate font-display text-sm uppercase tracking-[0.3em] outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label="Voltar ao início da galeria"
        >
          Photoizer
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onFavoritos}
            className={acao}
            aria-label={`Abrir Gostei${favoritos > 0 ? ` (${favoritos})` : ''}`}
            title="Gostei"
          >
            <Heart className="h-4 w-4" fill={favoritos > 0 ? 'currentColor' : 'none'} />
            {favoritos > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gallery-accent px-0.5 text-[10px] font-semibold text-white">
                {favoritos}
              </span>
            )}
          </button>
          <button
            onClick={onCarrinho}
            className={acao}
            aria-label={`Abrir carrinho${carrinho > 0 ? ` (${carrinho})` : ''}`}
            title="Carrinho"
          >
            <ShoppingBag className="h-4 w-4" />
            {carrinho > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gallery-ink px-0.5 text-[10px] font-semibold text-gallery-bg ring-1 ring-gallery-bg">
                {carrinho}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
