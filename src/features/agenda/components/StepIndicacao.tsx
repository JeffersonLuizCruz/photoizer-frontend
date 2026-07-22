import { useFormContext } from 'react-hook-form'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { WizardFormValues } from '../schemas/agendamento.schema'

function formatTelefone(value: string): string {
  const raw = value.replace(/\D/g, '').slice(0, 11)
  if (raw.length <= 2) return raw
  if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`
  return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
}

export function StepIndicacao() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<WizardFormValues>()

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">Indicação (opcional)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Preencha caso este cliente tenha sido indicado por outra pessoa.
          O indicador receberá uma comissão quando o pagamento for concluído.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="indicadorNome">Nome do Indicador</Label>
          <Input id="indicadorNome" {...register('indicadorNome')} placeholder="Quem indicou?" />
          {errors.indicadorNome && <p className="mt-1 text-sm text-destructive">{errors.indicadorNome.message}</p>}
        </div>

        <div>
          <Label htmlFor="indicadorTelefone">Telefone do Indicador</Label>
          <Input
            id="indicadorTelefone"
            placeholder="(11) 99999-9999"
            value={watch('indicadorTelefone') ?? ''}
            onChange={(e) => {
              const formatted = formatTelefone(e.target.value)
              setValue('indicadorTelefone', formatted, { shouldValidate: true })
            }}
          />
          {errors.indicadorTelefone && <p className="mt-1 text-sm text-destructive">{errors.indicadorTelefone.message}</p>}
        </div>
      </div>
    </div>
  )
}