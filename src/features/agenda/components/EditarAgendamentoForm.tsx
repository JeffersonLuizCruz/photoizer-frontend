import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import { cn } from '@/shared/lib/cn'
import { CalendarIcon } from 'lucide-react'
import { usePacotesList, useUsuariosList } from '../api/queries'
import { editarAgendamentoSchema, type EditarAgendamentoFormData } from '../schemas/agendamento.schema'
import type { Agendamento } from '../types'
import { ROUTES } from '@/shared/constants'
import { useNavigate } from 'react-router-dom'

const HORARIOS = Array.from({ length: 19 }, (_, i) => {
  const hora = Math.floor(i / 2) + 9
  const minuto = i % 2 === 0 ? '00' : '30'
  return `${String(hora).padStart(2, '0')}:${minuto}`
})

interface EditarAgendamentoFormProps {
  agendamento: Agendamento
  onSubmit: (data: EditarAgendamentoFormData) => void
  isPending: boolean
}

export function EditarAgendamentoForm({ agendamento, onSubmit, isPending }: EditarAgendamentoFormProps) {
  const navigate = useNavigate()
  const { data: pacotes } = usePacotesList()
  const { data: usuarios } = useUsuariosList()

  const dataHora = new Date(agendamento.dataHoraEnsaio)
  const horaStr = format(dataHora, 'HH:mm')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditarAgendamentoFormData>({
    resolver: zodResolver(editarAgendamentoSchema),
    defaultValues: {
      pacoteId: agendamento.pacoteId,
      dataHoraEnsaio: agendamento.dataHoraEnsaio,
      localEnsaio: agendamento.localEnsaio,
      enderecoCompleto: agendamento.enderecoCompleto ?? '',
      editorId: agendamento.editorId ?? '',
      taxaDeslocamento: agendamento.taxaDeslocamento,
      autorizaUsoImagem: agendamento.autorizaUsoImagem,
      observacoes: agendamento.observacoes ?? '',
    },
  })

  const selectedDate = watch('dataHoraEnsaio') ? new Date(watch('dataHoraEnsaio')) : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    const current = new Date(watch('dataHoraEnsaio'))
    const hora = format(current, 'HH:mm')
    const novaData = new Date(date)
    novaData.setHours(Number(hora.split(':')[0]), Number(hora.split(':')[1]))
    setValue('dataHoraEnsaio', novaData.toISOString(), { shouldValidate: true })
  }

  const handleHoraSelect = (hora: string) => {
    const current = new Date(watch('dataHoraEnsaio'))
    const novaData = new Date(current)
    novaData.setHours(Number(hora.split(':')[0]), Number(hora.split(':')[1]))
    setValue('dataHoraEnsaio', novaData.toISOString(), { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Dados do Cliente</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <p className="text-sm font-medium">{agendamento.clienteNome}</p>
          </div>
          <div>
            <Label>Telefone</Label>
            <p className="text-sm font-medium">{agendamento.clienteTelefone}</p>
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.CLIENTES_EDITAR.replace(':id', agendamento.clienteId))}
            >
              Editar Cliente
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pacoteId">Pacote *</Label>
          <Select
            value={watch('pacoteId')}
            onValueChange={(value) => setValue('pacoteId', value, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o pacote" />
            </SelectTrigger>
            <SelectContent>
              {pacotes?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.pacoteId && <p className="mt-1 text-sm text-destructive">{errors.pacoteId.message}</p>}
        </div>

        <div>
          <Label htmlFor="editorId">Editor Responsável</Label>
          <Select
            value={watch('editorId')}
            onValueChange={(value) => setValue('editorId', value, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o editor" />
            </SelectTrigger>
            <SelectContent>
              {usuarios?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Data do Ensaio *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Selecione a data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.dataHoraEnsaio && <p className="mt-1 text-sm text-destructive">{errors.dataHoraEnsaio.message}</p>}
        </div>

        <div>
          <Label htmlFor="hora">Horário *</Label>
          <Select value={horaStr} onValueChange={handleHoraSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o horário" />
            </SelectTrigger>
            <SelectContent>
              {HORARIOS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="localEnsaio">Local do Ensaio *</Label>
          <Input id="localEnsaio" {...register('localEnsaio')} placeholder="Local do ensaio" />
          {errors.localEnsaio && <p className="mt-1 text-sm text-destructive">{errors.localEnsaio.message}</p>}
        </div>

        <div>
          <Label htmlFor="enderecoCompleto">Endereço Completo</Label>
          <Input id="enderecoCompleto" {...register('enderecoCompleto')} placeholder="Endereço completo (opcional)" />
        </div>

        <div>
          <Label htmlFor="taxaDeslocamento">Taxa de Deslocamento</Label>
          <CurrencyInput
            value={watch('taxaDeslocamento')}
            onChange={(value) => setValue('taxaDeslocamento', value, { shouldValidate: true })}
          />
          {errors.taxaDeslocamento && <p className="mt-1 text-sm text-destructive">{errors.taxaDeslocamento.message}</p>}
        </div>

        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="autorizaUsoImagem"
              checked={watch('autorizaUsoImagem')}
              onCheckedChange={(checked) => setValue('autorizaUsoImagem', checked === true)}
            />
            <Label htmlFor="autorizaUsoImagem" className="cursor-pointer">Autoriza Uso de Imagem</Label>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <textarea
            id="observacoes"
            {...register('observacoes')}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Observações sobre o agendamento"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(`/agenda/${agendamento.id}`)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
