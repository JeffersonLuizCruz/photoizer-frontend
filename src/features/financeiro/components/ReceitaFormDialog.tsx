import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import { formatCurrency } from '@/shared/lib/format'
import { receitaSchema, type ReceitaFormValues } from '../schemas/receita.schema'
import {
  useCriarReceita,
  useAtualizarReceita,
  useClientesSearch,
  useConfigFinanceiro,
} from '../api/queries'
import { SearchableSelect } from './SearchableSelect'
import type { Receita } from '../types/receita.types'

interface ReceitaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receita?: Receita | null
}

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

export function ReceitaFormDialog({ open, onOpenChange, receita }: ReceitaFormDialogProps) {
  const criar = useCriarReceita()
  const atualizar = useAtualizarReceita()
  const config = useConfigFinanceiro()

  const [clienteSearch, setClienteSearch] = useState('')
  const { data: clientes, isLoading: loadingClientes } = useClientesSearch(clienteSearch)

  const form = useForm<ReceitaFormValues>({
    resolver: zodResolver(receitaSchema) as never,
    defaultValues: {
      agendamentoId: null,
      clienteId: null,
      tipoServico: 'ENSAIO',
      descricao: '',
      valorBruto: 0,
      status: 'PENDENTE',
      valorRecebido: 0,
      dataPrevisaoRecebimento: null,
      dataRecebimentoReal: null,
      formaPagamento: 'PIX',
      observacoes: '',
    },
  })

  const { register, setValue, watch, reset, formState: { errors } } = form
  const status = watch('status')
  const valorBruto = watch('valorBruto')

  useEffect(() => {
    if (open) {
      reset({
        agendamentoId: null,
        clienteId: receita?.clienteId ?? null,
        tipoServico: receita?.tipoServico ?? 'ENSAIO',
        descricao: receita?.descricao ?? '',
        valorBruto: receita?.valorBruto ?? 0,
        status: receita?.status ?? 'PENDENTE',
        valorRecebido: receita?.valorRecebido ?? 0,
        dataPrevisaoRecebimento: receita?.dataPrevisaoRecebimento ?? null,
        dataRecebimentoReal: receita?.dataRecebimentoReal ?? null,
        formaPagamento: receita?.formaPagamento ?? 'PIX',
        observacoes: receita?.observacoes ?? '',
      })
      setClienteSearch('')
    }
  }, [open, receita, reset])

  const percentualComissao = config?.data?.percentualComissao ?? 10
  const valorComissaoEstimada = valorBruto * (percentualComissao / 100)
  const valorFinalEstimado = Math.max(0, valorBruto - valorComissaoEstimada)

  const isPending = criar.isPending || atualizar.isPending

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      agendamentoId: null,
      clienteId: values.clienteId || null,
      tipoServico: values.tipoServico,
      descricao: values.descricao || undefined,
      valorBruto: values.valorBruto,
      status: values.status,
      valorRecebido: values.status === 'PAGO_TOTAL' ? undefined : values.valorRecebido,
      dataPrevisaoRecebimento: values.dataPrevisaoRecebimento || null,
      dataRecebimentoReal: values.dataRecebimentoReal || null,
      formaPagamento: (values.formaPagamento ?? null) as Receita['formaPagamento'],
      observacoes: values.observacoes || undefined,
    }

    const opts = {
      onSuccess: () => {
        toast.success(receita ? 'Receita atualizada' : 'Receita registrada')
        onOpenChange(false)
      },
      onError: (error: Error) => toast.error(error.message || 'Erro ao salvar receita'),
    }

    if (receita) {
      atualizar.mutate({ id: receita.id, request: payload }, opts)
    } else {
      criar.mutate(payload, opts)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{receita ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
          <DialogDescription>
            Registre uma receita avulsa do estúdio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <SearchableSelect
              options={(clientes ?? []).map((c) => ({ value: c.id, label: c.nome, sublabel: c.telefone }))}
              value={watch('clienteId')}
              onChange={(v) => {
                setValue('clienteId', v, { shouldValidate: true })
              }}
              placeholder="Buscar cliente..."
              emptyText="Digite para buscar cliente"
              isLoading={loadingClientes}
              onSearchChange={setClienteSearch}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipoServico">Tipo de serviço *</Label>
              <Select value={watch('tipoServico')} onValueChange={(v: ReceitaFormValues['tipoServico']) => setValue('tipoServico', v)}>
                <SelectTrigger id="tipoServico">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoServicoLabels).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(v: ReceitaFormValues['status']) => setValue('status', v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" {...register('descricao')} placeholder="Ex: Ensaio Família - Pacote Herança" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="valorBruto">Valor bruto (R$) *</Label>
              <CurrencyInput value={valorBruto} onChange={(v) => setValue('valorBruto', v)} />
              {errors.valorBruto && <p className="mt-1 text-sm text-destructive">{errors.valorBruto.message}</p>}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Valor final (bruto − comissão de {percentualComissao}%)</p>
              <p className="mt-0.5 text-lg font-semibold">{formatCurrency(valorFinalEstimado)}</p>
              <p className="text-xs text-muted-foreground">
                Comissão estimada: {formatCurrency(valorComissaoEstimada)}
              </p>
            </div>
          </div>

          {status === 'PAGO_PARCIAL' && (
            <div>
              <Label htmlFor="valorRecebido">Valor já recebido (R$) *</Label>
              <CurrencyInput value={watch('valorRecebido')} onChange={(v) => setValue('valorRecebido', v)} />
              {errors.valorRecebido && <p className="mt-1 text-sm text-destructive">{errors.valorRecebido.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dataPrevisaoRecebimento">Previsão de recebimento</Label>
              <Input id="dataPrevisaoRecebimento" type="date" value={watch('dataPrevisaoRecebimento') ?? ''} onChange={(e) => setValue('dataPrevisaoRecebimento', e.target.value || null)} />
            </div>
            <div>
              <Label htmlFor="dataRecebimentoReal">Recebido em</Label>
              <Input id="dataRecebimentoReal" type="date" value={watch('dataRecebimentoReal') ?? ''} onChange={(e) => setValue('dataRecebimentoReal', e.target.value || null)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="formaPagamento">Forma de pagamento</Label>
              <Select value={watch('formaPagamento') ?? undefined} onValueChange={(v) => setValue('formaPagamento', v)}>
                <SelectTrigger id="formaPagamento">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formaPagamentoLabels).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Input id="observacoes" {...register('observacoes')} placeholder="Observações opcionais" />
            </div>
          </div>

          <p className="flex items-start gap-1.5 rounded-md bg-blue-50 p-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            O valor final é calculado automaticamente: valor bruto menos a comissão do indicador (ou {percentualComissao}% padrão quando não há indicação).
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : receita ? 'Salvar alterações' : 'Registrar receita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
