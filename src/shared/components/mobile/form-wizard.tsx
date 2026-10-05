import { type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'

export interface WizardStep {
  id: string
  title: string
  description?: string
  content: ReactNode
}

interface FormWizardProps {
  steps: WizardStep[]
  current: number
  onStepChange: (step: number) => void
  onComplete: () => void
  onBeforeNext?: (current: number) => boolean | Promise<boolean>
  completeLabel?: string
  isSubmitting?: boolean
  completeDisabled?: boolean
  className?: string
}

export function FormWizard({
  steps,
  current,
  onStepChange,
  onComplete,
  onBeforeNext,
  completeLabel = 'Salvar',
  isSubmitting,
  completeDisabled,
  className,
}: FormWizardProps) {
  const isFirst = current === 0
  const isLast = current === steps.length - 1
  const progress = ((current + 1) / steps.length) * 100

  const handleNext = async () => {
    if (onBeforeNext && !(await onBeforeNext(current))) return
    if (isLast) {
      onComplete()
      return
    }
    onStepChange(current + 1)
  }

  return (
    <div className={cn('space-y-5', className)}>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Passo {current + 1} de {steps.length}
            </p>
            <h2 className="truncate text-base font-semibold">{steps[current].title}</h2>
          </div>
          {steps[current].description && (
            <p className="hidden shrink-0 text-xs text-muted-foreground sm:block">{steps[current].description}</p>
          )}
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={`Progresso: passo ${current + 1} de ${steps.length}`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Etapas">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                  index <= current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {index + 1}
              </span>
              <span className={cn(index === current ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {step.title}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div>{steps[current].content}</div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex items-center gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:bottom-0">
        {!isFirst && (
          <Button type="button" variant="outline" onClick={() => onStepChange(current - 1)} disabled={isSubmitting}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Voltar
          </Button>
        )}
        <Button type="button" onClick={handleNext} disabled={isSubmitting || (isLast && completeDisabled)} className="ml-auto">
          {isSubmitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />}
          {isLast ? completeLabel : 'Continuar'}
          {!isLast && <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )
}
