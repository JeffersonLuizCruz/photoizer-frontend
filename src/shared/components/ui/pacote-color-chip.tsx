import { cn } from '@/shared/lib/cn'
import { getReadableTextColor, normalizePackageColor } from '@/shared/lib/pacote-color'

interface PacoteColorChipProps {
  nome: string
  cor?: string | null
  className?: string
}

/**
 * Chip do pacote que comunica a cor escolhida com contraste garantido.
 * Usado nos detalhes do ensaio e onde o nome do pacote precisa de destaque visual.
 */
export function PacoteColorChip({ nome, cor, className }: PacoteColorChipProps) {
  const backgroundColor = normalizePackageColor(cor)
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm',
        className,
      )}
      style={{
        backgroundColor,
        color: getReadableTextColor(backgroundColor),
        borderColor: backgroundColor,
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
      <span className="min-w-0 truncate">{nome}</span>
    </span>
  )
}
