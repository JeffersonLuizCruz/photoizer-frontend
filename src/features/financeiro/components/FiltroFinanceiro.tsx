import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FilterX } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { DateRangePicker, type DateRange } from '@/shared/components/layout/DateRangePicker'
import { useClientesSearch } from '../api/queries'
import { SearchableSelect } from './SearchableSelect'
import type { DashboardQueryParams } from '../types/dashboard.types'

type PresetId = 'hoje' | 'semana' | 'mes' | '3m' | 'ano' | 'personalizado'

const PRESETS: Array<{ id: PresetId; label: string }> = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: '7 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: '3m', label: '3 meses' },
  { id: 'ano', label: 'Este ano' },
]

const tipoServicoLabels: Record<string, string> = {
  ENSAIO: 'Ensaio',
  CASAMENTO: 'Casamento',
  EVENTO: 'Evento',
  PRODUTO: 'Produto',
  OUTRO: 'Outro',
}

const statusLabels: Record<string, string> = {
  PAGO_TOTAL: 'Pago total',
  PAGO_PARCIAL: 'Pago parcial',
  PENDENTE: 'Pendente',
  CANCELADO: 'Cancelado',
}

const formaPagamentoLabels: Record<string, string> = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
  TRANSFERENCIA: 'Transferência',
  OUTRO: 'Outro',
}

interface FiltroFinanceiroProps {
  value: DashboardQueryParams
  onChange: (value: DashboardQueryParams) => void
  showTrabalhoSelects?: boolean
}

function computeRange(preset: PresetId): { from?: Date; to?: Date } {
  const today = new Date()
  switch (preset) {
    case 'hoje':
      return { from: today, to: today }
    case 'semana': {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from, to: today }
    }
    case 'mes': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from, to: today }
    }
    case '3m': {
      const from = new Date(today)
      from.setMonth(from.getMonth() - 2)
      from.setDate(1)
      return { from, to: today }
    }
    case 'ano': {
      const from = new Date(today.getFullYear(), 0, 1)
      return { from, to: today }
    }
    default:
      return {}
  }
}

export function FiltroFinanceiro({ value, onChange, showTrabalhoSelects = true }: FiltroFinanceiroProps) {
  const [preset, setPreset] = useState<PresetId>('3m')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [clienteSearch, setClienteSearch] = useState('')
  const { data: clientes } = useClientesSearch(clienteSearch)

  const activeRange = useMemo<DateRange | undefined>(() => {
    if (preset === 'personalizado') return customRange
    const r = computeRange(preset)
    return r.from ? { from: r.from, to: r.to } : undefined
  }, [preset, customRange])

  const applyPreset = (p: PresetId) => {
    setPreset(p)
    const r = computeRange(p)
    onChange({
      ...value,
      dataInicio: r.from ? format(r.from, 'yyyy-MM-dd') : undefined,
      dataFim: r.to ? format(r.to, 'yyyy-MM-dd') : undefined,
    })
  }

  const applyRange = (range: DateRange | undefined) => {
    setCustomRange(range)
    onChange({
      ...value,
      dataInicio: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      dataFim: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    })
  }

  const clearFilters = () => {
    setPreset('personalizado')
    setCustomRange(undefined)
    onChange({})
  }

  const hasFilter =
    !!value.dataInicio || !!value.tipoServico || !!value.status || !!value.clienteId || !!value.formaPagamento

  const periodLabel = activeRange?.from
    ? activeRange.to && format(activeRange.from, 'dd/MM/yyyy') !== format(activeRange.to, 'dd/MM/yyyy')
      ? `${format(activeRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(activeRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
      : format(activeRange.from, 'dd/MM/yyyy', { locale: ptBR })
    : 'Todo o período'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={preset === p.id ? 'default' : 'ghost'}
            className="h-7 px-2.5"
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </Button>
        ))}
        <DateRangePicker
          value={activeRange?.from ? activeRange : undefined}
          onChange={(range) => {
            setPreset('personalizado')
            applyRange(range)
          }}
          className="[&>button]:h-7"
          placeholder="Período"
        />
      </div>

      <Button variant="outline" size="sm" disabled title={periodLabel}>
        {periodLabel}
      </Button>

      {showTrabalhoSelects && (
        <>
          <Select value={value.tipoServico ?? 'all'} onValueChange={(v) => onChange({ ...value, tipoServico: v === 'all' ? undefined : v as DashboardQueryParams['tipoServico'] })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(tipoServicoLabels).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={value.status ?? 'all'} onValueChange={(v) => onChange({ ...value, status: v === 'all' ? undefined : v as DashboardQueryParams['status'] })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={value.formaPagamento ?? 'all'} onValueChange={(v) => onChange({ ...value, formaPagamento: v === 'all' ? undefined : v as DashboardQueryParams['formaPagamento'] })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as formas</SelectItem>
              {Object.entries(formaPagamentoLabels).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-[220px]">
            <SearchableSelect
              options={(clientes ?? []).map((c) => ({ value: c.id, label: c.nome, sublabel: c.telefone }))}
              value={value.clienteId}
              onChange={(v) => {
                onChange({ ...value, clienteId: v ?? undefined })
                setClienteSearch('')
              }}
              placeholder="Cliente..."
              emptyText="Digite para buscar cliente"
              onSearchChange={setClienteSearch}
            />
          </div>
        </>
      )}

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <FilterX className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
