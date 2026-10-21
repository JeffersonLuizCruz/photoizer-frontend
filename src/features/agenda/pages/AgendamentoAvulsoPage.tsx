import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { format, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { AlertTriangle, CalendarIcon, Copy, ExternalLink, Link2, Loader2, Percent, Save, Wallet } from 'lucide-react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { TimeSlotPicker } from '@/shared/components/ui/time-slot-picker'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import { ROUTES, FORMA_PAGAMENTO_LABELS } from '@/shared/constants'
import { formatCurrency } from '@/shared/lib/format'
import { parseDuracao } from '@/shared/lib/duracao'
import { cn } from '@/shared/lib/cn'
import { agendamentoAvulsoSchema, type AgendamentoAvulsoFormValues } from '../schemas/agendamento-avulso.schema'
import { HORARIOS_AVULSO } from '../constants'
import { useCriarAgendamentoAvulso, useDisponibilidade, useOpcoesAgendamentoAvulso, usePacotesList } from '../api/queries'
import type { CriarAgendamentoAvulsoPayload } from '../types'

interface ResultadoCriacao {
  id: string
  link: string | null
  criarOutro: boolean
}

export function AgendamentoAvulsoPage() {
  const navigate = useNavigate()
  const criar = useCriarAgendamentoAvulso()
  const { data: pacotes = [] } = usePacotesList()
  const { data: opcoes } = useOpcoesAgendamentoAvulso()
  const [continuando, setContinuando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoCriacao | null>(null)
  const custoInicializado = useRef(false)

  const defaultValues: AgendamentoAvulsoFormValues = {
    pacoteId: '',
    fotografoId: '',
    data: undefined as unknown as Date,
    hora: '',
    duracao: '1h',
    localEnsaio: '',
    modoEntrada: 'PERCENTUAL',
    percentualEntrada: 30,
    valorJaRecebido: 0,
    dataRecebimento: format(new Date(), 'yyyy-MM-dd'),
    formaPagamento: 'PIX',
    custoDeslocamento: 0,
    repassarDeslocamento: true,
    observacoes: '',
  }

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<AgendamentoAvulsoFormValues>({
    resolver: zodResolver(agendamentoAvulsoSchema) as any,
    defaultValues,
  })

  const pacoteId = watch('pacoteId')
  const fotografoId = watch('fotografoId')
  const dataValue = watch('data')
  const horaValue = watch('hora')
  const modoEntrada = watch('modoEntrada')
  const percentualEntrada = Number(watch('percentualEntrada')) || 0
  const valorJaRecebido = Number(watch('valorJaRecebido')) || 0
  const repassarDeslocamento = watch('repassarDeslocamento')
  const custoDeslocamento = Number(watch('custoDeslocamento')) || 0

  const pacoteEscolhido = useMemo(
    () => pacotes.find((p) => p.id === pacoteId),
    [pacotes, pacoteId],
  )
  const duracao = parseDuracao(watch('duracao'))

  const responsaveis = opcoes?.fotografos ?? []
  const semFotografo = responsaveis.length === 0

  const valorTotal = useMemo(() => {
    if (!pacoteEscolhido) return 0
    const taxa = repassarDeslocamento ? custoDeslocamento : 0
    return Number((pacoteEscolhido.valorBase + taxa).toFixed(2))
  }, [custoDeslocamento, pacoteEscolhido, repassarDeslocamento])

  const valorEntrada = modoEntrada === 'PERCENTUAL'
    ? Number((valorTotal * percentualEntrada / 100).toFixed(2))
    : valorJaRecebido
  const saldoRestante = Math.max(valorTotal - (modoEntrada === 'RECEBIDO' ? valorJaRecebido : 0), 0)

  const { data: disponibilidade, isFetching: verificandoDisponibilidade } = useDisponibilidade(
    dataValue instanceof Date ? dataValue : undefined,
    horaValue || undefined,
    duracao,
    pacoteEscolhido?.bloqueiaDiaInteiro ?? false,
    fotografoId || undefined,
  )
  const conflito = disponibilidade && !disponibilidade.disponivel

  useEffect(() => {
    if (!opcoes || custoInicializado.current) return
    custoInicializado.current = true
    setValue('custoDeslocamento', opcoes.taxaDeslocamentoPadrao, { shouldValidate: true })
    setValue('percentualEntrada', Number(opcoes.percentualEntrada) || 30, { shouldValidate: true })
  }, [opcoes, setValue])

  function handlePacoteChange(id: string) {
    setValue('pacoteId', id, { shouldValidate: true })
    const pacote = pacotes.find((p) => p.id === id)
    if (!pacote) return
    setValue('duracao', pacote.duracaoEstimada || '1h', { shouldValidate: true })
  }

  function handleSubmitAvulso(values: AgendamentoAvulsoFormValues, criarOutro: boolean) {
    if (values.modoEntrada === 'RECEBIDO' && values.valorJaRecebido > valorTotal) {
      setError('valorJaRecebido', { message: 'O valor recebido não pode ser maior que o valor total' })
      return
    }

    const [hora, minuto] = values.hora.split(':').map(Number)
    const dataHora = new Date(
      values.data.getFullYear(),
      values.data.getMonth(),
      values.data.getDate(),
      hora,
      minuto,
      0,
      0,
    )

    const payload: CriarAgendamentoAvulsoPayload = {
      pacoteId: values.pacoteId,
      fotografoId: values.fotografoId,
      dataHoraEnsaio: format(dataHora, "yyyy-MM-dd'T'HH:mm:ss"),
      duracaoMinutos: parseDuracao(values.duracao),
      localEnsaio: values.localEnsaio,
      percentualEntrada: values.modoEntrada === 'PERCENTUAL' ? values.percentualEntrada : undefined,
      valorJaRecebido: values.modoEntrada === 'RECEBIDO' ? values.valorJaRecebido : undefined,
      dataRecebimento: values.modoEntrada === 'RECEBIDO' ? `${values.dataRecebimento}T12:00:00` : undefined,
      formaPagamento: values.modoEntrada === 'RECEBIDO' ? values.formaPagamento : undefined,
      custoDeslocamento: values.custoDeslocamento,
      repassarDeslocamento: values.repassarDeslocamento,
      observacoes: values.observacoes || undefined,
    }

    setContinuando(criarOutro)
    criar.mutate(payload, {
      onSuccess: (agendamento) => {
        setContinuando(false)
        const link = agendamento.tokenProposta
          ? `${window.location.origin}${ROUTES.PROPOSTA_PUBLICA.replace(':token', agendamento.tokenProposta)}`
          : null

        if (criarOutro) {
          reset({
            ...defaultValues,
            pacoteId: values.pacoteId,
            fotografoId: values.fotografoId,
            duracao: values.duracao,
            modoEntrada: values.modoEntrada,
            percentualEntrada: values.percentualEntrada,
            valorJaRecebido: values.valorJaRecebido,
            custoDeslocamento: values.custoDeslocamento,
            repassarDeslocamento: values.repassarDeslocamento,
            formaPagamento: values.formaPagamento,
          })
        }

        setResultado({ id: agendamento.id, link, criarOutro })
      },
      onError: () => setContinuando(false),
    })
  }

  const salvar = (criarOutro: boolean) => {
    void handleSubmit((values) => handleSubmitAvulso(values, criarOutro))()
  }

  const copiarLink = async () => {
    if (!resultado?.link) return
    await navigator.clipboard.writeText(resultado.link)
    toast.success('Link copiado para a área de transferência')
  }

  const fecharResultado = () => {
    const criado = resultado
    setResultado(null)
    if (criado && !criado.criarOutro) {
      navigate(ROUTES.AGENDA_DETALHES.replace(':id', criado.id))
    }
  }

  return (
    <div>
      <PageTitle
        title="Agendamento Avulso"
        description="Cadastre um ensaio já confirmado e gere o link para o cliente preencher o contrato."
        breadcrumbs={[{ label: 'Agenda', href: ROUTES.AGENDA }, { label: 'Agendamento avulso' }]}
      />

      <form className="mx-auto max-w-3xl space-y-5">
        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div>
            <h2 className="font-semibold">Ensaio</h2>
            <p className="text-xs text-muted-foreground">
              O agendamento entra na agenda como confirmado. O cliente preenche os próprios dados pelo link.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="pacoteId">Pacote *</Label>
              <Select value={pacoteId} onValueChange={handlePacoteChange}>
                <SelectTrigger id="pacoteId"><SelectValue placeholder="Selecione o pacote" /></SelectTrigger>
                <SelectContent>
                  {pacotes.filter((p) => p.ativo).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — {formatCurrency(p.valorBase)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pacoteId && <p className="mt-1 text-sm text-destructive">{errors.pacoteId.message}</p>}
            </div>

            <div>
              <Label>Data do ensaio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={cn('w-full justify-start text-left font-normal', !dataValue && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataValue instanceof Date ? format(dataValue, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataValue instanceof Date ? dataValue : undefined}
                    onSelect={(date) => { if (date) setValue('data', date, { shouldValidate: true }) }}
                    disabled={(date: Date) => date < startOfToday()}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.data && <p className="mt-1 text-sm text-destructive">{errors.data.message}</p>}
            </div>

            <div>
              <Label htmlFor="hora">Horário *</Label>
              <TimeSlotPicker
                id="hora"
                value={horaValue}
                onChange={(value) => setValue('hora', value, { shouldValidate: true })}
                slots={HORARIOS_AVULSO}
                placeholder="Selecione um horário"
                title="Horário do ensaio"
                description={dataValue instanceof Date ? `Horário para ${format(dataValue, "dd 'de' MMMM", { locale: ptBR })}` : 'Selecione o horário de início do ensaio.'}
                invalid={!!errors.hora}
              />
              {errors.hora && <p className="mt-1 text-sm text-destructive">{errors.hora.message}</p>}
              {verificandoDisponibilidade && (
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidade...
                </p>
              )}
              {conflito && disponibilidade && (
                <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-sm font-medium text-destructive">Horário indisponível</p>
                  </div>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    {disponibilidade.conflitos.map((c) => (
                      <li key={c.agendamentoId}>{c.clienteNome || 'Agendamento'} — {c.horario}</li>
                    ))}
                    {disponibilidade.bloqueios.map((b) => (
                      <li key={b.bloqueioId}>Compromisso: {b.titulo}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="localEnsaio">Local do ensaio *</Label>
              <Input id="localEnsaio" {...register('localEnsaio')} placeholder="Praça, estúdio, etc." />
              {errors.localEnsaio && <p className="mt-1 text-sm text-destructive">{errors.localEnsaio.message}</p>}
            </div>

            <div>
              <Label htmlFor="fotografoId">Fotógrafo responsável *</Label>
              <Select value={fotografoId} onValueChange={(value) => setValue('fotografoId', value, { shouldValidate: true })} disabled={semFotografo}>
                <SelectTrigger id="fotografoId"><SelectValue placeholder="Selecione o fotógrafo" /></SelectTrigger>
                <SelectContent>
                  {responsaveis.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {semFotografo && <p className="mt-1 text-xs text-destructive">Nenhum fotógrafo cadastrado.</p>}
              {errors.fotografoId && <p className="mt-1 text-sm text-destructive">{errors.fotografoId.message}</p>}
            </div>

            <div>
              <Label htmlFor="duracao">Duração do ensaio</Label>
              <Input id="duracao" {...register('duracao')} placeholder="Ex: 2h, 2h30, 90min, 2 horas" />
              <p className="mt-1 text-xs text-muted-foreground">Formatos aceitos: 2h, 2h30, 90min, 2 horas.</p>
              {errors.duracao && <p className="mt-1 text-sm text-destructive">{errors.duracao.message}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div>
            <h2 className="font-semibold">Valores da reserva</h2>
            <p className="text-xs text-muted-foreground">
              Escolha informar o percentual de entrada ou o valor que já foi recebido.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={modoEntrada === 'PERCENTUAL' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setValue('modoEntrada', 'PERCENTUAL', { shouldValidate: true })}
            >
              <Percent className="mr-2 h-4 w-4" />
              Percentual de entrada
            </Button>
            <Button
              type="button"
              variant={modoEntrada === 'RECEBIDO' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setValue('modoEntrada', 'RECEBIDO', { shouldValidate: true })}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Valor já recebido
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {modoEntrada === 'PERCENTUAL' ? (
              <div>
                <Label htmlFor="percentualEntrada">Percentual de entrada (%)</Label>
                <Input
                  id="percentualEntrada"
                  type="number"
                  min={0.01}
                  max={100}
                  step="0.01"
                  inputMode="decimal"
                  {...register('percentualEntrada', { valueAsNumber: true })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Entrada de {formatCurrency(valorEntrada)} sobre {formatCurrency(valorTotal)}.
                </p>
                {errors.percentualEntrada && <p className="mt-1 text-sm text-destructive">{errors.percentualEntrada.message}</p>}
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="valorJaRecebido">Valor já recebido (R$)</Label>
                  <CurrencyInput
                    id="valorJaRecebido"
                    value={valorJaRecebido}
                    onChange={(value) => setValue('valorJaRecebido', value, { shouldValidate: true })}
                  />
                  {errors.valorJaRecebido && <p className="mt-1 text-sm text-destructive">{errors.valorJaRecebido.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dataRecebimento">Data do recebimento</Label>
                  <Input id="dataRecebimento" type="date" {...register('dataRecebimento')} />
                  {errors.dataRecebimento && <p className="mt-1 text-sm text-destructive">{errors.dataRecebimento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="formaPagamento">Forma de pagamento</Label>
                  <Select value={watch('formaPagamento')} onValueChange={(value) => setValue('formaPagamento', value as AgendamentoAvulsoFormValues['formaPagamento'], { shouldValidate: true })}>
                    <SelectTrigger id="formaPagamento"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="custoDeslocamento">Custo de deslocamento (R$)</Label>
              <CurrencyInput id="custoDeslocamento" value={custoDeslocamento} onChange={(value) => setValue('custoDeslocamento', value, { shouldValidate: true })} />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex w-full items-center justify-between rounded-lg border p-3">
                <div>
                  <span className="text-sm font-medium">Repassar ao cliente</span>
                  <p className="text-xs text-muted-foreground">Deslocamento entra no valor total</p>
                </div>
                <Switch checked={repassarDeslocamento} onCheckedChange={(checked) => setValue('repassarDeslocamento', checked)} activeClassName="!bg-emerald-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor total</span>
              <strong className="tabular-nums">{formatCurrency(valorTotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {modoEntrada === 'RECEBIDO' ? 'Entrada recebida' : 'Entrada exigida'}
              </span>
              <strong className="tabular-nums text-amber-600">{formatCurrency(valorEntrada)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Saldo restante</span>
              <strong className={cn('tabular-nums', saldoRestante > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                {formatCurrency(saldoRestante)}
              </strong>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div>
            <h2 className="font-semibold">Observações</h2>
          </div>
          <div>
            <Label htmlFor="observacoes">Observações internas</Label>
            <Textarea id="observacoes" rows={3} {...register('observacoes')} placeholder="Anotações sobre o ensaio" />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.AGENDA)} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary" onClick={() => salvar(true)} disabled={criar.isPending || !!conflito || verificandoDisponibilidade || semFotografo}>
            {criar.isPending && continuando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar e criar outro
          </Button>
          <Button type="button" onClick={() => salvar(false)} disabled={criar.isPending || !!conflito || verificandoDisponibilidade || semFotografo}>
            {criar.isPending && !continuando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar agendamento
          </Button>
        </div>
      </form>

      <Dialog open={!!resultado} onOpenChange={(open) => !open && fecharResultado()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendamento criado</DialogTitle>
            <DialogDescription>
              Envie o link abaixo para o cliente preencher os dados e assinar o contrato.
            </DialogDescription>
          </DialogHeader>

          {resultado?.link ? (
            <div className="space-y-2">
              <Label htmlFor="link-avulso">Link do contrato</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input id="link-avulso" readOnly value={resultado.link} className="min-w-0 flex-1 basis-full text-xs sm:basis-auto" />
                <Button type="button" variant="outline" size="sm" onClick={() => void copiarLink()}>
                  <Copy className="mr-1 h-4 w-4" />
                  Copiar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => window.open(resultado.link!, '_blank', 'noopener')}>
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              O agendamento foi criado, mas o link não foi retornado. Consulte a aba Contrato nos detalhes.
            </p>
          )}

          <DialogFooter>
            {resultado?.criarOutro ? (
              <Button type="button" variant="outline" onClick={() => setResultado(null)}>
                <Link2 className="mr-1 h-4 w-4" />
                Continuar criando
              </Button>
            ) : null}
            <Button type="button" onClick={fecharResultado}>
              Ver agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
