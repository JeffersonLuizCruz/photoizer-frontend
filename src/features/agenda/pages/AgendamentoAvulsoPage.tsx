import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { format, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CalendarIcon, Loader2, Save, UserPlus } from 'lucide-react'
import { PageTitle } from '@/shared/components/layout/PageTitle'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
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

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2')
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
}

function formatTelefone(value: string): string {
  const raw = value.replace(/\D/g, '').slice(0, 11)
  if (raw.length <= 2) return raw
  if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`
  if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`
  return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
}

export function AgendamentoAvulsoPage() {
  const navigate = useNavigate()
  const criar = useCriarAgendamentoAvulso()
  const { data: pacotes = [] } = usePacotesList()
  const { data: opcoes } = useOpcoesAgendamentoAvulso()
  const [continuando, setContinuando] = useState(false)
  const valoresEditados = useRef(false)
  const custoInicializado = useRef(false)

  const defaultValues: AgendamentoAvulsoFormValues = {
    clienteNome: '',
    clienteTelefone: '',
    clienteEmail: '',
    clienteCpf: '',
    clienteCidade: '',
    clienteEstado: '',
    pacoteId: '',
    fotografoId: '',
    data: undefined as unknown as Date,
    hora: '',
    duracao: '1h',
    localEnsaio: '',
    valorTotal: 0,
    valorEntradaExigido: 0,
    valorPago: 0,
    dataPagamento: format(new Date(), 'yyyy-MM-dd'),
    formaPagamento: 'PIX',
    tipoPagamento: 'ENTRADA',
    custoDeslocamento: 0,
    repassarDeslocamento: true,
    autorizaUsoImagem: false,
    observacoes: '',
  }

  const {
    register,
    handleSubmit,
    setValue,
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
  const valorTotal = Number(watch('valorTotal')) || 0
  const valorPago = Number(watch('valorPago')) || 0
  const repassarDeslocamento = watch('repassarDeslocamento')
  const custoDeslocamento = Number(watch('custoDeslocamento')) || 0

  const pacoteEscolhido = useMemo(
    () => pacotes.find((p) => p.id === pacoteId),
    [pacotes, pacoteId],
  )
  const duracao = parseDuracao(watch('duracao'))

  const responsaveis = opcoes?.fotografos ?? []
  const semFotografo = responsaveis.length === 0

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
  }, [opcoes, setValue])

  useEffect(() => {
    if (!pacoteEscolhido || valoresEditados.current) return
    const taxa = repassarDeslocamento ? custoDeslocamento : 0
    const total = Number((pacoteEscolhido.valorBase + taxa).toFixed(2))
    const percentual = Number(opcoes?.percentualEntrada ?? 30)
    setValue('valorTotal', total, { shouldValidate: true })
    setValue('valorEntradaExigido', Number((total * percentual / 100).toFixed(2)), { shouldValidate: true })
  }, [custoDeslocamento, opcoes?.percentualEntrada, pacoteEscolhido, repassarDeslocamento, setValue])

  function handlePacoteChange(id: string) {
    setValue('pacoteId', id, { shouldValidate: true })
    const pacote = pacotes.find((p) => p.id === id)
    if (!pacote) return

    valoresEditados.current = false
    const taxa = repassarDeslocamento ? custoDeslocamento : 0
    const total = Number((pacote.valorBase + taxa).toFixed(2))
    const percentual = Number(opcoes?.percentualEntrada ?? 30)
    setValue('valorTotal', total, { shouldValidate: true })
    setValue('valorEntradaExigido', Number((total * percentual / 100).toFixed(2)), { shouldValidate: true })
    setValue('duracao', pacote.duracaoEstimada || '1h', { shouldValidate: true })
  }

  function handleSubmitAvulso(values: AgendamentoAvulsoFormValues, criarOutro: boolean) {
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
      clienteNome: values.clienteNome.trim(),
      clienteTelefone: values.clienteTelefone,
      clienteEmail: values.clienteEmail || undefined,
      clienteCpf: values.clienteCpf || undefined,
      clienteCidade: values.clienteCidade || undefined,
      clienteEstado: values.clienteEstado || undefined,
      pacoteId: values.pacoteId,
      fotografoId: values.fotografoId,
      dataHoraEnsaio: format(dataHora, "yyyy-MM-dd'T'HH:mm:ss"),
      duracaoMinutos: parseDuracao(values.duracao),
      localEnsaio: values.localEnsaio,
      valorTotal: values.valorTotal,
      valorEntradaExigido: values.valorEntradaExigido,
      valorPago: values.valorPago,
      dataPagamento: `${values.dataPagamento}T12:00:00`,
      formaPagamento: values.formaPagamento,
      tipoPagamento: values.tipoPagamento,
      custoDeslocamento: values.custoDeslocamento,
      repassarDeslocamento: values.repassarDeslocamento,
      autorizaUsoImagem: values.autorizaUsoImagem,
      observacoes: values.observacoes || undefined,
    }

    setContinuando(criarOutro)
    criar.mutate(payload, {
      onSuccess: (agendamento) => {
        setContinuando(false)
        if (!criarOutro) {
          navigate(ROUTES.AGENDA_DETALHES.replace(':id', agendamento.id))
          return
        }
        valoresEditados.current = false
        reset({
          ...defaultValues,
          pacoteId: values.pacoteId,
          fotografoId: values.fotografoId,
          duracao: values.duracao,
          valorTotal: values.valorTotal,
          valorEntradaExigido: values.valorEntradaExigido,
          custoDeslocamento: values.custoDeslocamento,
          repassarDeslocamento: values.repassarDeslocamento,
          formaPagamento: values.formaPagamento,
          tipoPagamento: values.tipoPagamento,
          autorizaUsoImagem: values.autorizaUsoImagem,
        })
      },
      onError: () => setContinuando(false),
    })
  }

  const salvar = (criarOutro: boolean) => {
    void handleSubmit((values) => handleSubmitAvulso(values, criarOutro))()
  }

  return (
    <div>
      <PageTitle
        title="Agendamento Avulso"
        description="Cadastre um ensaio já confirmado, com cliente, valores e recebimento registrados."
        breadcrumbs={[{ label: 'Agenda', href: ROUTES.AGENDA }, { label: 'Agendamento avulso' }]}
      />

      <form className="mx-auto max-w-3xl space-y-5">
        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold">Dados do cliente</h2>
              <p className="text-xs text-muted-foreground">O cliente é reutilizado pelo telefone ou CPF quando já existir.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="clienteNome">Nome completo *</Label>
              <Input id="clienteNome" {...register('clienteNome')} placeholder="Nome do cliente" />
              {errors.clienteNome && <p className="mt-1 text-sm text-destructive">{errors.clienteNome.message}</p>}
            </div>

            <div>
              <Label htmlFor="clienteTelefone">Telefone *</Label>
              <Input
                id="clienteTelefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                {...register('clienteTelefone')}
                placeholder="(11) 99999-9999"
                onChange={(e) => {
                  e.target.value = formatTelefone(e.target.value)
                  register('clienteTelefone').onChange(e)
                }}
              />
              {errors.clienteTelefone && <p className="mt-1 text-sm text-destructive">{errors.clienteTelefone.message}</p>}
            </div>

            <div>
              <Label htmlFor="clienteCpf">CPF</Label>
              <Input
                id="clienteCpf"
                inputMode="numeric"
                {...register('clienteCpf')}
                placeholder="000.000.000-00"
                onChange={(e) => {
                  e.target.value = formatCpf(e.target.value)
                  register('clienteCpf').onChange(e)
                }}
              />
              {errors.clienteCpf && <p className="mt-1 text-sm text-destructive">{errors.clienteCpf.message}</p>}
            </div>

            <div>
              <Label htmlFor="clienteEmail">E-mail</Label>
              <Input id="clienteEmail" type="email" {...register('clienteEmail')} placeholder="email@exemplo.com" />
              {errors.clienteEmail && <p className="mt-1 text-sm text-destructive">{errors.clienteEmail.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <Label htmlFor="clienteCidade">Cidade</Label>
                <Input id="clienteCidade" {...register('clienteCidade')} placeholder="Cidade" />
              </div>
              <div>
                <Label htmlFor="clienteEstado">UF</Label>
                <Input id="clienteEstado" {...register('clienteEstado')} placeholder="SP" maxLength={2} className="uppercase" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div>
            <h2 className="font-semibold">Ensaio</h2>
            <p className="text-xs text-muted-foreground">O agendamento entra na agenda como confirmado.</p>
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
            <h2 className="font-semibold">Valores e recebimento</h2>
            <p className="text-xs text-muted-foreground">O total e a entrada podem ser ajustados conforme o combinado.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="valorTotal">Valor total (R$)</Label>
              <CurrencyInput id="valorTotal" value={valorTotal} onChange={(value) => { valoresEditados.current = true; setValue('valorTotal', value, { shouldValidate: true }) }} />
              {errors.valorTotal && <p className="mt-1 text-sm text-destructive">{errors.valorTotal.message}</p>}
            </div>
            <div>
              <Label htmlFor="valorEntradaExigido">Entrada exigida (R$)</Label>
              <CurrencyInput id="valorEntradaExigido" value={Number(watch('valorEntradaExigido')) || 0} onChange={(value) => { valoresEditados.current = true; setValue('valorEntradaExigido', value, { shouldValidate: true }) }} />
              {errors.valorEntradaExigido && <p className="mt-1 text-sm text-destructive">{errors.valorEntradaExigido.message}</p>}
            </div>
            <div>
              <Label htmlFor="valorPago">Valor recebido agora (R$)</Label>
              <CurrencyInput id="valorPago" value={valorPago} onChange={(value) => setValue('valorPago', value, { shouldValidate: true })} />
              {errors.valorPago && <p className="mt-1 text-sm text-destructive">{errors.valorPago.message}</p>}
            </div>
            <div>
              <Label htmlFor="dataPagamento">Data do recebimento</Label>
              <Input id="dataPagamento" type="date" {...register('dataPagamento')} />
              {errors.dataPagamento && <p className="mt-1 text-sm text-destructive">{errors.dataPagamento.message}</p>}
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
            <div>
              <Label htmlFor="tipoPagamento">Tipo do recebimento</Label>
              <Select value={watch('tipoPagamento')} onValueChange={(value) => setValue('tipoPagamento', value as AgendamentoAvulsoFormValues['tipoPagamento'], { shouldValidate: true })}>
                <SelectTrigger id="tipoPagamento"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="FINAL">Pagamento final</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Saldo restante</span>
                <strong className={cn('tabular-nums', valorTotal - valorPago > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                  {formatCurrency(Math.max(valorTotal - valorPago, 0))}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div>
            <h2 className="font-semibold">Observações</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações internas</Label>
              <Textarea id="observacoes" rows={3} {...register('observacoes')} placeholder="Anotações sobre o ensaio" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <span className="text-sm font-medium">Autoriza uso de imagem</span>
                <p className="text-xs text-muted-foreground">Marque conforme o contrato/recibo em papel.</p>
              </div>
              <Switch checked={watch('autorizaUsoImagem')} onCheckedChange={(checked) => setValue('autorizaUsoImagem', checked)} activeClassName="!bg-emerald-500" />
            </div>
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
    </div>
  )
}
