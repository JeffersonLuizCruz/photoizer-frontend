import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { Calendar, type CalendarProps } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { useIsMobile } from '@/shared/hooks/use-media-query'

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangePickerProps extends Omit<CalendarProps, 'mode' | 'selected' | 'onSelect'> {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Selecionar período',
  className,
  align = 'start',
  ...calendarProps
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const displayText = value?.from
    ? value.to
      ? `${format(value.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(value.to, 'dd/MM/yyyy', { locale: ptBR })}`
      : `${format(value.from, 'dd/MM/yyyy', { locale: ptBR })} - ...`
    : placeholder

  const trigger = (
    <Button
      variant="outline"
      className={cn('w-full justify-start text-left font-normal', !value?.from && 'text-muted-foreground')}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {displayText}
    </Button>
  )

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range)
    if (range?.from && range?.to) setOpen(false)
  }

  if (isMobile) {
    return (
      <div className={cn('grid gap-2', className)}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className="w-full max-w-md">
            <DialogTitle className="sr-only">Selecionar período</DialogTitle>
            <Calendar
              mode="range"
              selected={value as { from: Date; to: Date } | undefined}
              onSelect={handleSelect as never}
              numberOfMonths={1}
              locale={ptBR}
              {...calendarProps}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            selected={value as { from: Date; to: Date } | undefined}
            onSelect={handleSelect as never}
            numberOfMonths={2}
            locale={ptBR}
            autoFocus
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
