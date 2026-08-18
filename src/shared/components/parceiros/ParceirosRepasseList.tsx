import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import { useParceirosList } from '@/shared/api/parceiros'

interface ParceirosRepasseListProps {
  base: number
}

interface Row {
  fotografoId: string
  valorRepassar?: number
  tipoValor: 'FIXO' | 'PERCENTUAL'
  percentual?: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function ParceirosRepasseList({ base }: ParceirosRepasseListProps) {
  const { control, setValue } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'fotografos' })
  const rows = useWatch({ control, name: 'fotografos' }) as Row[] | undefined
  const { data: parceiros = [] } = useParceirosList()

  const selectedIds = new Set((rows ?? []).map((r) => r?.fotografoId).filter(Boolean))

  const total = (rows ?? []).reduce((acc, row) => {
    if (!row) return acc
    if (row.tipoValor === 'PERCENTUAL') {
      const pct = Number(row.percentual) || 0
      return acc + (base * pct) / 100
    }
    const val = Number(row.valorRepassar) || 0
    return acc + val
  }, 0)

  const setRow = (idx: number, patch: Partial<Row>) => {
    const current = ((rows ?? [])[idx] ?? {}) as Partial<Row>
    setValue(`fotografos.${idx}`, { tipoValor: 'FIXO', ...current, ...patch }, { shouldValidate: true })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Equipe de Parceiros (Repasse)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ fotografoId: '', tipoValor: 'FIXO', valorRepassar: 0, percentual: undefined } satisfies Row)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Adicionar parceiro
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum parceiro vinculado. Adicione fotógrafos, editores e demais envolvidos para dividir o repasse do ensaio.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, idx) => {
          const row = ((rows ?? [])[idx] ?? {}) as Partial<Row>
          const tipo = row.tipoValor ?? 'FIXO'
          const isPercentual = tipo === 'PERCENTUAL'
          return (
            <div key={field.id} className="grid grid-cols-12 items-end gap-2 rounded-lg border p-2">
              <div className="col-span-4">
                <Label className="text-xs">Parceiro</Label>
                <Select value={row.fotografoId ?? ''} onValueChange={(value) => setRow(idx, { fotografoId: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {parceiros
                      .filter((p) => p.ativo && (p.id === row.fotografoId || !selectedIds.has(p.id)))
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <Label className="text-xs">Tipo</Label>
                <Select value={tipo} onValueChange={(value) => setRow(idx, { tipoValor: value as Row['tipoValor'] })}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXO">Valor (R$)</SelectItem>
                    <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4">
                <Label className="text-xs">{isPercentual ? 'Percentual (%)' : 'Valor a repassar (R$)'}</Label>
                {isPercentual ? (
                  <Input
                    className="h-8"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={row.percentual ?? ''}
                    onChange={(e) =>
                      setRow(idx, { percentual: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                    placeholder="Ex: 40"
                  />
                ) : (
                  <CurrencyInput
                    value={row.valorRepassar ?? 0}
                    onChange={(value) => setRow(idx, { valorRepassar: value })}
                  />
                )}
              </div>

              <div className="col-span-1 flex items-center justify-end">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {fields.length > 0 && (
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Base de cálculo (pacote + deslocamento): {formatCurrency(base)}
            {rows?.some((r) => r?.tipoValor === 'PERCENTUAL') && (
              <span className="ml-1 text-xs text-muted-foreground/70">(% calculado sobre a base)</span>
            )}
          </span>
          <span className="font-semibold">Total repasses: {formatCurrency(total)}</span>
        </div>
      )}
    </div>
  )
}
