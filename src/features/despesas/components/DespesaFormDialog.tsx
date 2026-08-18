import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import { FileUpload } from '@/shared/components/layout/FileUpload'
import { despesaSchema, type DespesaFormValues } from '../schemas/despesa.schema'
import { useCriarDespesa, useAtualizarDespesa, useUploadComprovanteDespesa, useDespesasCategorias, useAgendamentosOpcoes } from '../api/queries'
import { useFotografosList } from '@/features/fotografos/api/queries'
import type { FormaPagamento } from '../types/despesa.types'
import type { DespesaResponse } from '../types/despesa.types'

interface DespesaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  despesa?: DespesaResponse | null
  onOpenCategorias?: () => void
  agendamentoFixoId?: string
  agendamentoFixoLabel?: string
}

const statusLabels: Record<string, string> = {
  PAGO: 'Pago',
  PENDENTE: 'Pendente',
  RECORRENTE: 'Recorrente',
}

const recorrenciaLabels: Record<string, string> = {
  UNICA: 'Única',
  MENSAL: 'Mensal',
  ANUAL: 'Anual',
}

const formaPagamentoLabels: Record<string, string> = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
  TRANSFERENCIA: 'Transferência',
  OUTRO: 'Outro',
}

export function DespesaFormDialog({ open, onOpenChange, despesa, onOpenCategorias, agendamentoFixoId, agendamentoFixoLabel }: DespesaFormDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const { data: categorias, isLoading: loadingCategorias } = useDespesasCategorias(true)
  const { data: agendamentos, isLoading: loadingAgendamentos } = useAgendamentosOpcoes()
  const { data: fotografos = [] } = useFotografosList()
  const criar = useCriarDespesa()
  const atualizar = useAtualizarDespesa()
  const upload = useUploadComprovanteDespesa()

  const form = useForm<DespesaFormValues>({
    resolver: zodResolver(despesaSchema) as never,
    defaultValues: {
      descricao: '',
      valor: 0,
      categoriaId: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      formaPagamento: 'PIX',
      status: 'PENDENTE',
      recorrencia: 'UNICA',
      agendamentoId: null,
      fotografoId: null,
      observacao: '',
    },
  })

  const { register, setValue, watch, reset, formState: { errors } } = form

  useEffect(() => {
    if (open) {
      reset({
        descricao: despesa?.descricao ?? '',
        valor: despesa?.valor ?? 0,
        categoriaId: despesa?.categoriaId ?? '',
        data: despesa?.data ?? format(new Date(), 'yyyy-MM-dd'),
        formaPagamento: despesa?.formaPagamento ?? 'PIX',
        status: despesa?.status ?? 'PENDENTE',
        recorrencia: despesa?.recorrencia ?? 'UNICA',
        agendamentoId: despesa?.agendamentoId ?? agendamentoFixoId ?? null,
        fotografoId: despesa?.fotografoId ?? null,
        observacao: despesa?.observacao ?? '',
      })
      setArquivo(null)
    }
  }, [open, despesa, reset, agendamentoFixoId])

  const defaultCategoria = useMemo(() => {
    if (!categorias || categorias.length === 0) return ''
    if (!despesa?.categoriaId) return categorias[0].id
    return ''
  }, [categorias, despesa])

  useEffect(() => {
    if (open && !despesa && defaultCategoria && !watch('categoriaId')) {
      setValue('categoriaId', defaultCategoria)
    }
  }, [open, despesa, defaultCategoria, setValue, watch])

  const isPending = criar.isPending || atualizar.isPending || upload.isPending

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      descricao: values.descricao,
      valor: values.valor,
      categoriaId: values.categoriaId,
      data: values.data,
      formaPagamento: (values.formaPagamento ?? undefined) as FormaPagamento | undefined,
      status: values.status,
      recorrencia: values.recorrencia,
      agendamentoId: values.agendamentoId ?? undefined,
      fotografoId: values.fotografoId ?? undefined,
      observacao: values.observacao || undefined,
    }

    const finish = (id: string) => {
      if (arquivo) {
        upload.mutate(
          { id, arquivo },
          {
            onSuccess: () => {
              toast.success('Despesa salva com comprovante')
              onOpenChange(false)
            },
            onError: () => {
              toast.error('Despesa salva, mas o comprovante não pôde ser enviado')
              onOpenChange(false)
            },
          },
        )
      } else {
        toast.success(despesa ? 'Despesa atualizada' : 'Despesa registrada')
        onOpenChange(false)
      }
    }

    if (despesa) {
      atualizar.mutate(
        { id: despesa.id, request: payload },
        { onSuccess: (data) => finish(data.id) },
      )
    } else {
      criar.mutate(payload, { onSuccess: (data) => finish(data.id) })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{despesa ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
          <DialogDescription>
            Registre ou edite uma despesa com categoria, recorrência e comprovante.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" {...register('descricao')} placeholder="Ex: Assinatura Adobe Lightroom" />
            {errors.descricao && <p className="mt-1 text-sm text-destructive">{errors.descricao.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor (R$) *</Label>
              <CurrencyInput value={watch('valor')} onChange={(v) => setValue('valor', v)} />
              {errors.valor && <p className="mt-1 text-sm text-destructive">{errors.valor.message}</p>}
            </div>
            <div>
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" {...register('data')} />
              {errors.data && <p className="mt-1 text-sm text-destructive">{errors.data.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="categoriaId">Categoria *</Label>
                <button type="button" onClick={onOpenCategorias} className="text-xs text-primary hover:underline">
                  Gerenciar
                </button>
              </div>
              <Select value={watch('categoriaId')} onValueChange={(v) => setValue('categoriaId', v)}>
                <SelectTrigger id="categoriaId" disabled={loadingCategorias}>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoriaId && <p className="mt-1 text-sm text-destructive">{errors.categoriaId.message}</p>}
            </div>
            <div>
              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
              <Select value={watch('formaPagamento') ?? undefined} onValueChange={(v) => setValue('formaPagamento', v)}>
                <SelectTrigger id="formaPagamento">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formaPagamentoLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={watch('status')} onValueChange={(v: DespesaFormValues['status']) => setValue('status', v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="recorrencia">Recorrência *</Label>
              <Select value={watch('recorrencia')} onValueChange={(v: DespesaFormValues['recorrencia']) => setValue('recorrencia', v)}>
                <SelectTrigger id="recorrencia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(recorrenciaLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="agendamentoId">Trabalho / Sessão vinculada</Label>
            {agendamentoFixoId ? (
              <Input id="agendamentoId" value={agendamentoFixoLabel ?? 'Trabalho atual'} disabled readOnly />
            ) : (
              <Select value={watch('agendamentoId') ?? undefined} onValueChange={(v) => setValue('agendamentoId', v)}>
                <SelectTrigger id="agendamentoId" disabled={loadingAgendamentos}>
                  <SelectValue placeholder="Nenhum (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {agendamentos?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="fotografoId">Custo do Fotógrafo</Label>
            <Select
              value={watch('fotografoId') ?? undefined}
              onValueChange={(v) => setValue('fotografoId', v || null)}
            >
              <SelectTrigger id="fotografoId">
                <SelectValue placeholder="Não é custo de fotógrafo" />
              </SelectTrigger>
              <SelectContent>
                {fotografos.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecione o fotógrafo se esta despesa for um custo dele (parceiro, material, etc.)
            </p>
          </div>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <textarea
              id="observacao"
              {...register('observacao')}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Observações opcionais"
            />
          </div>

          <div>
            <Label>Comprovante</Label>
            <FileUpload
              accept="image/*,.pdf"
              label="Envie a imagem ou PDF do comprovante (opcional)"
              onFilesChange={(files) => setArquivo(files[0] ?? null)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : despesa ? 'Salvar alterações' : 'Registrar despesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
