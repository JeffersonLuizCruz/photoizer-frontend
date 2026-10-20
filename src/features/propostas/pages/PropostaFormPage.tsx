import { useState, useRef, useEffect } from 'react'
import { useForm, FormProvider, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { format, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CalendarIcon, Loader2, Percent, Search, User, X } from 'lucide-react'
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
import { ROUTES, AGENDAMENTO_STATUS } from '@/shared/constants'
import { formatCurrency } from '@/shared/lib/format'
import { parseDuracao } from '@/shared/lib/duracao'
import { cn } from '@/shared/lib/cn'
import { ParceirosRepasseList } from '@/shared/components/parceiros/ParceirosRepasseList'
import { novaPropostaSchema, type NovaPropostaFormValues } from '../schemas/proposta.schema'
import {
  useCriarProposta,
  useAtualizarProposta,
  usePropostaDetalhe,
  usePacotesOptions,
  useUsuariosOptions,
  useIndicadoresSearch,
  useDisponibilidadeProposta,
} from '../api/queries'

const HORARIOS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
]

interface PropostaFormPageProps {
  mode: 'create' | 'edit'
}

export function PropostaFormPage({ mode }: PropostaFormPageProps) {
  const isEdit = mode === 'edit'
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const dataParam = searchParams.get('data')
  const defaultValues: NovaPropostaFormValues = {
    pacoteId: '',
    data: dataParam ? new Date(`${dataParam}T00:00:00`) : (undefined as unknown as Date),
    hora: '',
    localEnsaio: '',
    fotografoId: '',
    fotografos: [],
    custoDeslocamento: 0,
    repassarDeslocamento: true,
    observacoes: '',
  }
  const criar = useCriarProposta()
  const atualizar = useAtualizarProposta()
  const salvando = isEdit ? atualizar.isPending : criar.isPending
  const { data: detalhe, isLoading: carregandoDetalhe, isError: erroDetalhe } = usePropostaDetalhe(isEdit ? id : undefined)
  const { data: pacotes = [] } = usePacotesOptions()
  const { data: usuarios = [] } = useUsuariosOptions()
  const [searchIndicador, setSearchIndicador] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndicadorId, setSelectedIndicadorId] = useState<string | null>(null)
  const [selectedPercentual, setSelectedPercentual] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const inputIndicadorRef = useRef<HTMLInputElement>(null)
  const dropdownIndicadorRef = useRef<HTMLDivElement>(null)
  const { data: indicadores = [], isFetching: isFetchingIndicadores } = useIndicadoresSearch(searchIndicador)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownIndicadorRef.current &&
        !dropdownIndicadorRef.current.contains(event.target as Node) &&
        inputIndicadorRef.current &&
        !inputIndicadorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const methods = useForm<NovaPropostaFormValues>({
    resolver: zodResolver(novaPropostaSchema),
    defaultValues,
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = methods

  const passos = isEdit ? ['Ensaio', 'Valores'] : ['Ensaio', 'Valores', 'Indicação']

  useEffect(() => {
    if (!isEdit || !detalhe) return
    const dataHora = new Date(detalhe.dataHoraEnsaio)
    reset({
      pacoteId: detalhe.pacoteId,
      data: dataHora,
      hora: format(dataHora, 'HH:mm'),
      duracaoMinutos: detalhe.duracaoMinutos,
      localEnsaio: detalhe.localEnsaio,
      editorId: detalhe.editorId ?? '',
      fotografoId: detalhe.fotografoId ?? '',
      fotografos: (detalhe.fotografos ?? []).map((f) => ({
        fotografoId: f.fotografoId,
        tipoValor: f.tipoValor ?? 'FIXO',
        valorRepassar: f.valorRepassar ?? undefined,
        percentual: f.percentual ?? undefined,
      })),
      custoDeslocamento: detalhe.custoDeslocamento ?? 0,
      repassarDeslocamento: detalhe.repassarDeslocamento ?? true,
      observacoes: detalhe.observacoes ?? '',
    })
  }, [isEdit, detalhe, reset])

  const repassar = watch('repassarDeslocamento')
  const custoDeslocamento = Number(watch('custoDeslocamento')) || 0
  const dataValue = watch('data')
  const horaValue = watch('hora')
  const pacoteId = watch('pacoteId')
  const fotografoId = watch('fotografoId')

  const pacoteEscolhido = pacotes.find((p) => p.id === pacoteId)
  const baseCaculoRepasse = (pacoteEscolhido?.valorBase ?? 0) + (repassar ? custoDeslocamento : 0)

  const responsaveis = usuarios.filter(
    (u) => u.papel === 'FOTOGRAFO' && u.ativo !== false,
  )
  const semFotografo = responsaveis.length === 0

  const { data: disponibilidade, isFetching: verificandoDisponibilidade } = useDisponibilidadeProposta(
    dataValue instanceof Date ? dataValue : undefined,
    horaValue || undefined,
    pacoteEscolhido,
    fotografoId || undefined,
  )
  const conflito = disponibilidade && !disponibilidade.disponivel

  const indicadorNome = watch('indicadorNome')
  const indicadorTelefone = watch('indicadorTelefone')
  const hasIndicador = selectedIndicadorId || (!searchIndicador && indicadorNome && indicadorTelefone)

  function handleSelectIndicador(indicadorId: string, nome: string, telefone: string, percentualComissao: number | null) {
    setSelectedIndicadorId(indicadorId)
    setSelectedPercentual(percentualComissao)
    setValue('indicadorId', indicadorId, { shouldValidate: true })
    setValue('indicadorNome', nome, { shouldValidate: true })
    setValue('indicadorTelefone', telefone, { shouldValidate: true })
    setSearchIndicador('')
    setIsOpen(false)
  }

  function handleClearIndicador() {
    setSelectedIndicadorId(null)
    setSelectedPercentual(null)
    setValue('indicadorId', '', { shouldValidate: true })
    setValue('indicadorNome', '', { shouldValidate: true })
    setValue('indicadorTelefone', '', { shouldValidate: true })
    setSearchIndicador('')
    inputIndicadorRef.current?.focus()
  }

  const onSubmit = async (data: NovaPropostaFormValues) => {
    const payload = { ...data, duracaoMinutos: parseDuracao(pacoteEscolhido?.duracaoEstimada) }
    try {
      if (isEdit && id) {
        await atualizar.mutateAsync({ id, payload })
      } else {
        await criar.mutateAsync(payload)
      }
      navigate(ROUTES.PROPOSTAS)
    } catch {
      /* toast tratado na mutation */
    }
  }

  const camposPorPasso: FieldPath<NovaPropostaFormValues>[][] = [
    ['pacoteId', 'data', 'hora', 'localEnsaio', 'fotografoId'],
    [],
    [],
  ]

  const proximoPasso = async () => {
    const valido = await methods.trigger(camposPorPasso[step])
    if (valido) setStep((s) => Math.min(s + 1, passos.length - 1))
  }

  if (isEdit && carregandoDetalhe) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isEdit && (erroDetalhe || !detalhe || detalhe.status !== AGENDAMENTO_STATUS.PRE_RESERVA)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">Proposta não editável</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Só é possível editar propostas em pré-reserva (ainda não assinadas pelo cliente).
        </p>
        <Button className="mt-4" variant="outline" onClick={() => navigate(ROUTES.PROPOSTAS)}>
          Voltar para Propostas
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageTitle
        title={isEdit ? 'Editar Proposta' : 'Nova Proposta'}
        description={
          isEdit
            ? 'Altere os dados da pré-reserva. O link enviado ao cliente permanece o mesmo.'
            : 'Crie a pré-reserva e envie o link para o cliente preencher os dados e confirmar'
        }
        breadcrumbs={[
          { label: 'Propostas', href: ROUTES.PROPOSTAS },
          { label: isEdit ? 'Editar proposta' : 'Nova proposta' },
        ]}
      />

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Passo {step + 1} de {passos.length}
              </p>
              <h2 className="text-base font-semibold">{passos[step]}</h2>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(((step + 1) / passos.length) * 100)}
              aria-label={`Progresso: passo ${step + 1} de ${passos.length}`}
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / passos.length) * 100}%` }} />
            </div>
            <ol className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Etapas">
              {passos.map((titulo, index) => (
                <li key={titulo} className="flex items-center gap-1.5 text-xs">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                      index <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className={cn(index === step ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{titulo}</span>
                </li>
              ))}
            </ol>
          </div>

          {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="pacoteId">Pacote *</Label>
              <Select value={pacoteId ?? ''} onValueChange={(value) => setValue('pacoteId', value, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pacote" />
                </SelectTrigger>
                <SelectContent>
                  {pacotes.filter((p) => p.ativo).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} — {formatCurrency(p.valorBase)}
                      {p.bloqueiaDiaInteiro ? ' (dia inteiro)' : p.duracaoEstimada ? ` (${p.duracaoEstimada})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pacoteId && <p className="mt-1 text-sm text-destructive">{errors.pacoteId.message}</p>}
            </div>

            <div>
              <Label>Data do Ensaio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !dataValue && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataValue instanceof Date ? format(dataValue, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
                value={horaValue ?? ''}
                onChange={(value) => setValue('hora', value, { shouldValidate: true })}
                slots={HORARIOS}
                placeholder="Selecione um horário"
                title="Horário do ensaio"
                description={
                  dataValue instanceof Date
                    ? `Horário para ${format(dataValue, "dd 'de' MMMM", { locale: ptBR })}`
                    : 'Selecione o horário de início do ensaio.'
                }
                invalid={!!errors.hora}
              />
              {errors.hora && <p className="mt-1 text-sm text-destructive">{errors.hora.message}</p>}
              {verificandoDisponibilidade && (
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidade...
                </p>
              )}
              {conflito && disponibilidade && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 mt-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm font-medium text-destructive">Horário indisponível</p>
                  </div>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    {disponibilidade.conflitos.map((c) => (
                      <li key={c.agendamentoId}>
                        {c.clienteNome || 'Agendamento'} — {c.horario}
                      </li>
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

            <div className="sm:col-span-2">
              <Label>Fotógrafo responsável *</Label>
              <Select
                value={fotografoId ?? ''}
                onValueChange={(value) => setValue('fotografoId', value, { shouldValidate: true })}
                disabled={semFotografo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fotógrafo responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {semFotografo ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 mt-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm font-medium text-destructive">Nenhum fotógrafo cadastrado</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Defina o &quot;Nome do Fotógrafo&quot; em Configurações para poder criar propostas.
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  A disponibilidade é validada pela agenda do responsável escolhido.
                </p>
              )}
              {errors.fotografoId && <p className="mt-1 text-sm text-destructive">{errors.fotografoId.message}</p>}
            </div>

            <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/30 p-4">
              <ParceirosRepasseList base={baseCaculoRepasse} />
            </div>
          </div>
          )}

          {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="custoDeslocamento">Custo de Deslocamento (R$)</Label>
              <CurrencyInput id="custoDeslocamento" value={custoDeslocamento} onChange={(value) => setValue('custoDeslocamento', value, { shouldValidate: true })} />
            </div>

            <div className="flex items-end pb-2">
              <div className="flex items-center justify-between rounded-lg border p-3 w-full">
                <div>
                  <span className="text-sm font-medium">Repassar ao cliente</span>
                  <p className="text-xs text-muted-foreground">
                    {repassar ? `R$ ${custoDeslocamento.toFixed(2)} será cobrado do cliente` : 'Custo será absorvido (não cobrado do cliente)'}
                  </p>
                </div>
                <Switch checked={repassar} onCheckedChange={(checked) => setValue('repassarDeslocamento', checked)} activeClassName="!bg-emerald-500" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" {...register('observacoes')} rows={3} placeholder="Observações internas sobre a proposta" />
            </div>
          </div>
          )}

          {step === 2 && !isEdit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-sm font-medium">Indicação (opcional)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Busque por um indicador já cadastrado ou digite os dados manualmente. A comissão é criada na aprovação.
                </p>
              </div>

              {selectedPercentual != null && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                  <Percent className="h-4 w-4 text-primary" />
                  <span>Comissão de <strong>{selectedPercentual}%</strong> para este indicador.</span>
                </div>
              )}

              <div className="space-y-3">
                <Label>Buscar Indicador</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={inputIndicadorRef}
                    placeholder="Digite nome ou telefone do indicador..."
                    className="pl-9 pr-8"
                    value={searchIndicador}
                    onChange={(e) => { setSearchIndicador(e.target.value); setIsOpen(true) }}
                    onFocus={() => setIsOpen(true)}
                  />
                  {isFetchingIndicadores && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>

                {isOpen && searchIndicador.length >= 2 && (
                  <div ref={dropdownIndicadorRef} className="rounded-lg border bg-card shadow-lg max-h-60 overflow-y-auto">
                    {indicadores.length > 0 ? indicadores.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors', selectedIndicadorId === r.id && 'bg-muted/50')}
                        onClick={() => handleSelectIndicador(r.id, r.nome, r.telefone, r.percentualComissao)}
                      >
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{r.nome}</p>
                          <p className="text-xs text-muted-foreground">{r.telefone}</p>
                        </div>
                        {r.percentualComissao != null && (
                          <span className="shrink-0 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {r.percentualComissao}%
                          </span>
                        )}
                      </button>
                    )) : (
                      <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                        Nenhum indicador encontrado. Continue digitando para cadastrar um novo.
                      </p>
                    )}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou digite manualmente</span></div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="indicadorNome">Nome do Indicador</Label>
                    <div className="relative">
                      <Input
                        id="indicadorNome"
                        placeholder="Quem indicou?"
                        disabled={!!selectedIndicadorId}
                        value={(indicadorNome as string) ?? ''}
                        onChange={(e) => {
                          setValue('indicadorNome', e.target.value, { shouldValidate: true })
                          if (selectedIndicadorId) {
                            setSelectedIndicadorId(null); setSelectedPercentual(null)
                            setValue('indicadorId', '', { shouldValidate: true })
                          }
                        }}
                      />
                      {hasIndicador && (
                        <button type="button" onClick={handleClearIndicador} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="indicadorTelefone">Telefone do Indicador</Label>
                    <Input
                      id="indicadorTelefone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      disabled={!!selectedIndicadorId}
                      value={(indicadorTelefone as string) ?? ''}
                      onChange={(e) => {
                        setValue('indicadorTelefone', e.target.value, { shouldValidate: true })
                        if (selectedIndicadorId) {
                          setSelectedIndicadorId(null); setSelectedPercentual(null)
                          setValue('indicadorId', '', { shouldValidate: true })
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:bottom-0">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Voltar</Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.PROPOSTAS)}>Cancelar</Button>
            )}
            {step < passos.length - 1 ? (
              <Button type="button" onClick={proximoPasso}>Continuar</Button>
            ) : (
              <Button type="submit" disabled={salvando || !!conflito || verificandoDisponibilidade || semFotografo}>
                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar alterações' : 'Criar proposta'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
