import { cn } from '@/shared/lib/cn'

interface PropostaMarcaProps {
  nome?: string | null
  className?: string
}

/**
 * Selo da marca exibido na proposta pública.
 *
 * A superfície branca mantém a logo legível sobre o gradiente ciano do hero;
 * o anel e a faixa em cyan/sky/teal conversam com o coração turquesa da arte
 * e com a paleta da proposta (laranja/rosa continuam reservados ao CTA).
 */
export function PropostaMarca({ nome, className }: PropostaMarcaProps) {
  return (
    <div
      className={cn(
        'relative inline-flex max-w-full items-center justify-center overflow-hidden rounded-2xl bg-white/95 px-4 py-3 shadow-sm shadow-cyan-200/50 ring-1 ring-cyan-100 backdrop-blur',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400"
      />
      <img
        src="/api/v1/config/logo"
        alt={nome ? `Logo de ${nome}` : 'Logo do estúdio'}
        className="h-10 w-auto max-w-[220px] object-contain sm:h-14"
        draggable={false}
      />
    </div>
  )
}
