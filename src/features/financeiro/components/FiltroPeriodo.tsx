import { DateRangePicker, type DateRange } from '@/shared/components/layout/DateRangePicker'

interface FiltroPeriodoProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
}

export function FiltroPeriodo({ value, onChange }: FiltroPeriodoProps) {
  return (
    <DateRangePicker
      value={value}
      onChange={onChange}
      placeholder="Filtrar por período"
      className="w-56"
    />
  )
}
