import { cn } from '@/shared/lib/cn'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
<label className={cn('relative -m-2 inline-flex cursor-pointer items-center p-2', className)}>
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <span className="relative inline-block h-6 w-11">
          <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
          <span
            className={cn(
              'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background transition-transform',
              checked && 'translate-x-5',
            )}
          />
        </span>
      </label>
    )
  },
)

Switch.displayName = 'Switch'
