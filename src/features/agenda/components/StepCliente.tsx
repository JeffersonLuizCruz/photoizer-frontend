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

export function StepCliente() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<WizardFormValues>()

  const telefoneValue = watch('telefone')

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Nome do Cliente *</Label>
          <Input id="nome" {...register('nome')} placeholder="Nome completo" />
          {errors.nome && <p className="mt-1 text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="telefone">Telefone *</Label>
          <Input
            id="telefone"
            placeholder="(11) 99999-9999"
            value={telefoneValue ?? ''}
            onChange={(e) => {
              const formatted = formatTelefone(e.target.value)
              setValue('telefone', formatted, { shouldValidate: true })
            }}
          />
          {errors.telefone && <p className="mt-1 text-sm text-destructive">{errors.telefone.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
              let formatted = raw
              if (raw.length > 3) formatted = `${raw.slice(0, 3)}.${raw.slice(3)}`
              if (raw.length > 6) formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`
              if (raw.length > 9) formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`
              setValue('cpf', formatted)
            }}
          />
          {errors.cpf && <p className="mt-1 text-sm text-destructive">{errors.cpf.message}</p>}
        </div>

        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" {...register('cidade')} placeholder="Cidade" />
          {errors.cidade && <p className="mt-1 text-sm text-destructive">{errors.cidade.message}</p>}
        </div>

        <div>
          <Label htmlFor="estado">Estado</Label>
          <Input id="estado" {...register('estado')} placeholder="SP" maxLength={2} className="uppercase" />
          {errors.estado && <p className="mt-1 text-sm text-destructive">{errors.estado.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <textarea
            id="observacoes"
            {...register('observacoes')}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Observações sobre o cliente"
          />
          {errors.observacoes && <p className="mt-1 text-sm text-destructive">{errors.observacoes.message}</p>}
        </div>
      </div>
    </div>
  )
}
