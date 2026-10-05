import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  onApply?: () => void
  onClear?: () => void
  applyLabel?: string
  clearLabel?: string
  className?: string
}

export function FilterSheet({
  open,
  onOpenChange,
  title = 'Filtros',
  description,
  children,
  onApply,
  onClear,
  applyLabel = 'Aplicar filtros',
  clearLabel = 'Limpar',
  className,
}: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn('gap-0 p-0', className)}>
        <SheetHeader className="border-b px-6 pb-4 pr-14 pt-5 text-left">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">{children}</div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-background px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row-reverse sm:pb-4">
          {onApply && (
            <Button type="button" onClick={onApply} className="w-full sm:w-auto">
              {applyLabel}
            </Button>
          )}
          {onClear && (
            <Button type="button" variant="outline" onClick={onClear} className="w-full sm:w-auto">
              {clearLabel}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
