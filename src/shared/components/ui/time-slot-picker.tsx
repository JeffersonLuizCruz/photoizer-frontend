import { useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'
import { useIsMobile } from '@/shared/hooks/use-media-query'
import { cn } from '@/shared/lib/cn'

interface TimeSlotPickerProps {
  value?: string
  onChange: (value: string) => void
  slots: readonly string[]
  id?: string
  placeholder?: string
  disabled?: boolean
  allowCustom?: boolean
  title?: string
  description?: string
  ariaLabel?: string
  invalid?: boolean
  className?: string
}

interface TimeSlotPanelProps {
  slots: string[]
  value?: string
  onSelect: (value: string) => void
  allowCustom: boolean
  custom: string
  onCustomChange: (value: string) => void
}

function periodoDoHorario(slot: string): string {
  const hora = Number(slot.slice(0, 2))
  if (hora < 12) return 'Manhã'
  if (hora < 18) return 'Tarde'
  return 'Noite'
}

function normalizarHorario(valor: string): string {
  const [hora = '', minuto = ''] = valor.split(':')
  return `${hora.padStart(2, '0')}:${minuto.slice(0, 2).padStart(2, '0')}`
}

function TimeSlotPanel({
  slots,
  value,
  onSelect,
  allowCustom,
  custom,
  onCustomChange,
}: TimeSlotPanelProps) {
  const grupos = ['Manhã', 'Tarde', 'Noite']
    .map((label) => ({ label, slots: slots.filter((slot) => periodoDoHorario(slot) === label) }))
    .filter((grupo) => grupo.slots.length > 0)

  const aplicarPersonalizado = () => {
    if (!custom) return
    onSelect(normalizarHorario(custom))
  }

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Horários disponíveis" className="space-y-4">
        {grupos.map((grupo) => (
          <div key={grupo.label} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {grupo.label}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {grupo.slots.map((slot) => {
                const selecionado = slot === value
                return (
                  <button
                    key={slot}
                    type="button"
                    role="radio"
                    aria-checked={selecionado}
                    onClick={() => onSelect(slot)}
                    className={cn(
                      'flex min-h-11 items-center justify-center rounded-xl border px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      selecionado
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-input bg-background hover:bg-muted',
                    )}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {allowCustom && (
        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Outro horário
          </p>
          <div className="flex gap-2">
            <Input
              type="time"
              step={60}
              value={custom}
              onChange={(e) => onCustomChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  aplicarPersonalizado()
                }
              }}
              className="min-w-0 flex-1 tabular-nums"
              aria-label="Horário personalizado"
            />
            <Button type="button" onClick={aplicarPersonalizado} disabled={!custom}>
              Aplicar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Use para horários fora da grade.</p>
        </div>
      )}
    </div>
  )
}

export function TimeSlotPicker({
  value = '',
  onChange,
  slots,
  id,
  placeholder = 'Selecione um horário',
  disabled = false,
  allowCustom = false,
  title = 'Selecione um horário',
  description,
  ariaLabel,
  invalid = false,
  className,
}: TimeSlotPickerProps) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const isMobile = useIsMobile()

  const slotsExibidos = value && !slots.includes(value) ? [...slots, value].sort() : [...slots]

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen && allowCustom) {
      setCustom(value && !slots.includes(value) ? value : '')
    }
  }

  const handleSelect = (novoHorario: string) => {
    onChange(novoHorario)
    setOpen(false)
  }

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full justify-start text-left font-normal',
        !value && 'text-muted-foreground',
        className,
      )}
    >
      <Clock className="mr-2 h-4 w-4 shrink-0" />
      <span className="truncate">{value || placeholder}</span>
      <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )

  const panel = (
    <TimeSlotPanel
      slots={slotsExibidos}
      value={value}
      onSelect={handleSelect}
      allowCustom={allowCustom}
      custom={custom}
      onCustomChange={setCustom}
    />
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent className="max-h-[85dvh] gap-0 p-0">
          <SheetHeader className="border-b px-6 pb-4 pr-14 pt-5 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {panel}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="max-h-[var(--radix-popover-content-available-height)] w-[22rem] overflow-y-auto overscroll-contain p-4"
        align="start"
        collisionPadding={12}
      >
        <div className="mb-4 space-y-1">
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {panel}
      </PopoverContent>
    </Popover>
  )
}
