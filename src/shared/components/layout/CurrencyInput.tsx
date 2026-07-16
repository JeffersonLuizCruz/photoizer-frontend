import { forwardRef, useState, useCallback, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number
  onChange: (value: number) => void
  locale?: string
  currency?: string
}

function formatCurrency(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseCurrency(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(',', '.')
  const num = Number.parseFloat(cleaned)
  return Number.isNaN(num) ? 0 : num
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, locale = 'pt-BR', currency = 'BRL', className, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => formatCurrency(value, locale, currency))
    const [focused, setFocused] = useState(false)

    const handleFocus = useCallback(() => {
      setFocused(true)
      setDisplayValue(
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value),
      )
    }, [value, locale])

    const handleBlur = useCallback(() => {
      setFocused(false)
      setDisplayValue(formatCurrency(value, locale, currency))
    }, [value, locale, currency])

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        if (/^[\d,.-]*$/.test(raw.replace(/[^\d,.-]/g, '')) || raw === '') {
          setDisplayValue(raw)
          const parsed = parseCurrency(raw)
          onChange(parsed)
        }
      },
      [onChange],
    )

    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          R$
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={focused ? displayValue : formatCurrency(value, locale, currency)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'
