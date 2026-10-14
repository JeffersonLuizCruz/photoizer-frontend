import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Label } from '@/shared/components/ui/label'
import { PACKAGE_COLORS, getReadableTextColor } from '@/shared/lib/pacote-color'

interface PacoteColorPickerProps {
  value: string | undefined
  onChange: (value: string) => void
  error?: string
}

export function PacoteColorPicker({ value, onChange, error }: PacoteColorPickerProps) {
  const normalized = value?.toUpperCase()
  const selectedColor = PACKAGE_COLORS.find((color) => color.value.toUpperCase() === normalized)

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label asChild>
          <span>Cor do pacote *</span>
        </Label>
        {selectedColor && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-3 w-3 rounded-full border border-black/10"
              style={{ backgroundColor: selectedColor.value }}
            />
            {selectedColor.label}
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Cor do pacote"
        className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-12"
      >
        {PACKAGE_COLORS.map((color) => {
          const isSelected = color.value.toUpperCase() === normalized
          return (
            <button
              key={color.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={color.label}
              title={color.label}
              onClick={() => onChange(color.value)}
              className={cn(
                'flex h-9 w-full items-center justify-center rounded-md border-2 transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isSelected
                  ? 'border-foreground shadow-sm'
                  : 'border-black/10 hover:scale-105 dark:border-white/20',
              )}
              style={{ backgroundColor: color.value, color: getReadableTextColor(color.value) }}
            >
              {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
            </button>
          )
        })}
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        A cor identifica o pacote na agenda e nos detalhes do ensaio.
      </p>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
}
