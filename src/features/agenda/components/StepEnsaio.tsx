import { useFormContext } from 'react-hook-form'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { usePacotesList, useUsuariosList } from '../api/queries'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Input } from '@/shared/components/ui/input'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import { cn } from '@/shared/lib/cn'
import type { WizardFormValues } from '../schemas/agendamento.schema'

const HORARIOS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function StepEnsaio() {
  const { data: pacotes, isLoading: isLoadingPacotes } = usePacotesList()
  const { data: usuarios } = useUsuariosList()
  const { register, setValue, watch, formState: { errors } } = useFormContext<WizardFormValues>()

  const dataValue = watch('data')
  const pacoteId = watch('pacoteId')
  const pacoteSelecionado = pacotes?.find((p) => p.id === pacoteId)

  return (
    <div className="space-y-4">
      <div>
        <Label>Pacote *</Label>
        <Select value={pacoteId ?? ''} onValueChange={(value) => setValue('pacoteId', value)}>
          <SelectTrigger>
            <SelectValue
              placeholder={isLoadingPacotes ? 'Carregando...' : 'Selecione um pacote'}
            />
          </SelectTrigger>
          <SelectContent>
            {pacotes?.map((pacote) => (
              <SelectItem key={pacote.id} value={pacote.id}>
                {pacote.nome} - {formatCurrency(pacote.valorBase)}
                {pacote.bloqueiaDiaInteiro ? ' (dia inteiro)' : pacote.duracaoEstimada ? ` (${pacote.duracaoEstimada})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.pacoteId && (
          <p className="mt-1 text-sm text-destructive">{errors.pacoteId.message}</p>
        )}
        {pacoteSelecionado && (
          <p className="mt-1 text-xs text-muted-foreground">
            {pacoteSelecionado.quantidadeFotos} fotos · {pacoteSelecionado.quantidadeVideos} vídeos ·{' '}
            {formatCurrency(pacoteSelecionado.valorBase)}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Data do Ensaio *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dataValue && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataValue
                  ? format(dataValue, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dataValue}
                onSelect={(date) => {
                  if (date) setValue('data', date, { shouldValidate: true })
                }}
                disabled={(date: Date) => date < new Date()}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.data && (
            <p className="mt-1 text-sm text-destructive">{errors.data.message}</p>
          )}
        </div>

        <div>
          <Label>Horário *</Label>
          <Select value={watch('hora') ?? ''} onValueChange={(value) => setValue('hora', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um horário" />
            </SelectTrigger>
            <SelectContent>
              {HORARIOS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.hora && (
            <p className="mt-1 text-sm text-destructive">{errors.hora.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="localEnsaio">Local do Ensaio *</Label>
        <Input id="localEnsaio" {...register('localEnsaio')} placeholder="Ex: Parque Ibirapuera, Estúdio, etc." />
        {errors.localEnsaio && <p className="mt-1 text-sm text-destructive">{errors.localEnsaio.message}</p>}
      </div>

      <div>
        <Label htmlFor="enderecoCompleto">Endereço Completo</Label>
        <Input
          id="enderecoCompleto"
          {...register('enderecoCompleto')}
          placeholder="Rua, número, bairro, CEP"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Editor Responsável</Label>
          <Select value={watch('editorId') ?? ''} onValueChange={(value) => setValue('editorId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um editor" />
            </SelectTrigger>
            <SelectContent>
              {usuarios?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Taxa de Deslocamento (R$)</Label>
          <CurrencyInput
            value={watch('taxaDeslocamento') ?? 0}
            onChange={(value) => setValue('taxaDeslocamento', value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors">
        <input
          type="checkbox"
          checked={watch('autorizaUsoImagem') ?? false}
          onChange={(e) => setValue('autorizaUsoImagem', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <div>
          <span className="text-sm font-medium">Autorização de uso de imagem</span>
          <p className="text-xs text-muted-foreground">
            Cliente autoriza o uso das imagens para divulgação
          </p>
        </div>
      </label>
    </div>
  )
}
