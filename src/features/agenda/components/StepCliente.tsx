import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Search, UserCheck, Loader2 } from 'lucide-react'
import { useBuscarClientePorTelefone } from '../api/queries'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import type { WizardFormValues } from '../schemas/agendamento.schema'

function formatTelefone(value: string): string {
  const raw = value.replace(/\D/g, '').slice(0, 11)
  if (raw.length <= 2) return raw
  if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`
  return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
}

const ORIGEM_OPTIONS = [
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'ANUNCIO', label: 'Anúncio' },
  { value: 'OUTROS', label: 'Outros' },
] as const

export function StepCliente() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<WizardFormValues>()
  const [searchTelefone, setSearchTelefone] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(false)
  const [buscouSemResultado, setBuscouSemResultado] = useState(false)

  const telefoneValue = watch('telefone')

  const { data: clienteBuscado, isFetching } = useBuscarClientePorTelefone(searchTelefone)

  useEffect(() => {
    const raw = (telefoneValue ?? '').replace(/\D/g, '')
    if (raw.length === 11 && !clienteEncontrado) {
      setSearchTelefone(telefoneValue!)
    }
  }, [telefoneValue, clienteEncontrado])

  useEffect(() => {
    if (isFetching) return
    if (!searchTelefone) return

    if (clienteBuscado) {
      setClienteEncontrado(true)
      setBuscouSemResultado(false)
      setValue('clienteId', clienteBuscado.id)
      setValue('nome', clienteBuscado.nome)
      setValue('telefone', clienteBuscado.telefone)
      setValue('email', clienteBuscado.email ?? '')
      setValue('cpf', clienteBuscado.cpf ?? '')
      setValue('cidade', clienteBuscado.cidade ?? '')
      setValue('estado', clienteBuscado.estado ?? '')
      if (clienteBuscado.origem) {
        setValue('origem', clienteBuscado.origem as 'INDICACAO' | 'ANUNCIO' | 'OUTROS')
      }
    } else {
      setBuscouSemResultado(true)
    }
  }, [clienteBuscado, isFetching, searchTelefone, setValue])

  const handleBuscarClick = () => {
    const raw = telefoneValue?.replace(/\D/g, '') ?? ''
    if (raw.length >= 10) {
      setBuscouSemResultado(false)
      setSearchTelefone(telefoneValue!)
    }
  }

  const limparBusca = () => {
    setClienteEncontrado(false)
    setBuscouSemResultado(false)
    setSearchTelefone('')
    setValue('clienteId', undefined)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-2 text-sm font-medium">Buscar cliente por telefone</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="buscaTelefone">Telefone</Label>
            <div className="relative">
              <Input
                id="buscaTelefone"
                value={telefoneValue ?? ''}
                onChange={(e) => {
                  const formatted = formatTelefone(e.target.value)
                  setValue('telefone', formatted)
                }}
                placeholder="(11) 99999-9999"
              />
              {isFetching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleBuscarClick}
            disabled={isFetching || (telefoneValue?.replace(/\D/g, '')?.length ?? 0) < 10}
          >
            <Search className="mr-1 h-4 w-4" />
            Buscar
          </Button>
        </div>

        {clienteEncontrado && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2 text-sm">
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="flex-1">Cliente encontrado! Os campos foram preenchidos automaticamente.</span>
            <Button type="button" variant="ghost" size="sm" onClick={limparBusca}>
              Limpar
            </Button>
          </div>
        )}
        {buscouSemResultado && !clienteEncontrado && (
          <p className="mt-2 text-xs text-muted-foreground">
            Nenhum cliente encontrado. Preencha os dados para cadastrar um novo.
          </p>
        )}
      </div>

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

        <div>
          <Label>Origem</Label>
          <Select value={watch('origem') ?? ''} onValueChange={(value) => setValue('origem', value as 'INDICACAO' | 'ANUNCIO' | 'OUTROS')}>
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
