import { useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import type { FotografoRepasseInput } from '../services/fotografo.service'

interface RepasseInlineEditorProps {
  initial: {
    tipoValor: 'FIXO' | 'PERCENTUAL'
    percentual: number | null
    valorRepassar: number
  }
  isSaving?: boolean
  onSave: (payload: FotografoRepasseInput) => void
  onCancel: () => void
}

export function RepasseInlineEditor({ initial, isSaving, onSave, onCancel }: RepasseInlineEditorProps) {
  const [tipoValor, setTipoValor] = useState<'FIXO' | 'PERCENTUAL'>(initial.tipoValor)
  const [valorRepassar, setValorRepassar] = useState<number>(initial.valorRepassar)
  const [percentual, setPercentual] = useState<number | undefined>(
    initial.percentual != null ? initial.percentual : undefined,
  )

  const isPercentual = tipoValor === 'PERCENTUAL'

  const handleSave = () => {
    onSave(
      isPercentual
        ? { tipoValor: 'PERCENTUAL', percentual }
        : { tipoValor: 'FIXO', valorRepassar },
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div>
        <Label className="text-xs">Tipo</Label>
        <Select value={tipoValor} onValueChange={(v) => setTipoValor(v as 'FIXO' | 'PERCENTUAL')}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXO">Valor (R$)</SelectItem>
            <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">{isPercentual ? 'Percentual (%)' : 'Valor (R$)'}</Label>
        {isPercentual ? (
          <Input
            className="h-8 w-24"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={percentual ?? ''}
            onChange={(e) => setPercentual(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="Ex: 40"
          />
        ) : (
          <CurrencyInput
            value={valorRepassar}
            onChange={setValorRepassar}
          />
        )}
      </div>

      <Button type="button" size="sm" variant="ghost" className="h-8" onClick={handleSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-emerald-500" />}
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-8" onClick={onCancel} disabled={isSaving}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
