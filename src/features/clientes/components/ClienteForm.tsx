import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { clienteSchema, type ClienteFormData } from '../schemas/cliente.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { ROUTES } from '@/shared/constants'

interface ClienteFormProps {
  onSubmit: (data: ClienteFormData) => void
  defaultValues?: Partial<ClienteFormData>
  isLoading?: boolean
  mode: 'create' | 'edit'
}

const ORIGEM_OPTIONS = [
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'ANUNCIO', label: 'Anúncio' },
  { value: 'OUTROS', label: 'Outros' },
] as const

export function ClienteForm({ onSubmit, defaultValues, isLoading, mode }: ClienteFormProps) {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      cidade: '',
      estado: '',
      origem: undefined,
      observacoes: '',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (defaultValues?.origem) {
      setValue('origem', defaultValues.origem)
    }
  }, [defaultValues?.origem, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" {...register('nome')} placeholder="Nome completo" />
          {errors.nome && <p className="mt-1 text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="telefone">Telefone *</Label>
          <Input
            id="telefone"
            {...register('telefone')}
            placeholder="(11) 99999-9999"
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
              let formatted = raw
              if (raw.length > 2) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
              if (raw.length > 7) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
              e.target.value = formatted
              register('telefone').onChange(e)
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
            {...register('cpf')}
            placeholder="000.000.000-00"
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
              let formatted = raw
              if (raw.length > 3) formatted = `${raw.slice(0, 3)}.${raw.slice(3)}`
              if (raw.length > 6) formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`
              if (raw.length > 9) formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`
              e.target.value = formatted
              register('cpf').onChange(e)
            }}
          />
          {errors.cpf && <p className="mt-1 text-sm text-destructive">{errors.cpf.message}</p>}
        </div>

        <div>
          <Label htmlFor="origem">Origem *</Label>
          <Select
            onValueChange={(value) => setValue('origem', value as 'INDICACAO' | 'ANUNCIO' | 'OUTROS')}
            defaultValue={defaultValues?.origem}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a origem" />
            </SelectTrigger>
            <SelectContent>
              {ORIGEM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.origem && <p className="mt-1 text-sm text-destructive">{errors.origem.message}</p>}
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

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(ROUTES.CLIENTES)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  )
}
