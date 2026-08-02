import { useState, useCallback, useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Loader2, Copy, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import { wizardFormSchema, type WizardFormValues } from '../schemas/agendamento.schema'
import { useCreateAgendamento, useSalvarRascunho, useBuscarRascunho, useDeletarRascunho } from '../api/queries'
import { useWizardStore, type WizardPersistedData } from '../stores/wizard.store'
import type { RascunhoAgendamentoData } from '../services/agendamento.service'
import { StepCliente } from './StepCliente'
import { StepEnsaio } from './StepEnsaio'
import { StepIndicacao } from './StepIndicacao'
import { StepFinanceiro } from './StepFinanceiro'
import { StepConfirmacao } from './StepConfirmacao'

const STEPS = [
  { label: 'Cliente', component: StepCliente },
  { label: 'Ensaio', component: StepEnsaio },
  { label: 'Indicação', component: StepIndicacao },
  { label: 'Financeiro', component: StepFinanceiro },
  { label: 'Confirmação', component: StepConfirmacao },
] as const

const STEP_FIELDS: Record<number, (keyof WizardFormValues)[]> = {
  0: ['nome', 'telefone'],
  1: ['pacoteId', 'data', 'hora', 'localEnsaio'],
  2: [],
  3: [],
  4: [],
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <div className="flex items-center gap-0 w-max mx-auto">
        {STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0',
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {index < currentStep ? (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] sm:text-sm hidden sm:inline',
                  index <= currentStep ? 'font-medium' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 sm:mx-3 h-px w-6 sm:w-12 transition-colors shrink-0',
                  index < currentStep ? 'bg-primary' : 'bg-muted',
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface NovoAgendamentoWizardProps {
  dataInicial?: Date
}

export function NovoAgendamentoWizard({ dataInicial }: NovoAgendamentoWizardProps) {
  const store = useWizardStore()
  const [currentStep, setCurrentStepState] = useState(store.currentStep)
  const [comprovante, setComprovanteState] = useState<File | undefined>()
  const [confirmado, setConfirmadoState] = useState(store.confirmado)
  const [agendamentoCriado, setAgendamentoCriado] = useState<string | null>(null)
  const agendamentoCriadoRef = useRef(false)
  const navigate = useNavigate()

  const setCurrentStep = useCallback((fn: number | ((prev: number) => number)) => {
    const next = typeof fn === 'function' ? (fn as (prev: number) => number)(store.currentStep) : fn
    setCurrentStepState(next)
    store.setCurrentStep(next)
  }, [store])

  const setComprovante = useCallback((file: File | undefined) => {
    setComprovanteState(file)
    store.setComprovanteName(file?.name ?? null)
  }, [store])

  const setConfirmado = useCallback((confirmed: boolean) => {
    setConfirmadoState(confirmed)
    store.setConfirmado(confirmed)
  }, [store])

  const savedState = useWizardStore.getState()
  const hasDraft = Object.keys(savedState.formData).length > 0

  const draftData = savedState.formData
  const restoredDate = (() => {
    const d = draftData.data
    if (!d) return dataInicial
    return new Date(d.includes('T') ? d : d + 'T12:00:00')
  })()

  const defaultValues = {
    nome: draftData.nome ?? '',
    telefone: draftData.telefone ?? '',
    email: draftData.email ?? '',
    cpf: draftData.cpf ?? '',
    cidade: draftData.cidade ?? '',
    estado: draftData.estado ?? '',
    pacoteId: draftData.pacoteId ?? '',
    hora: draftData.hora ?? '',
    localEnsaio: draftData.localEnsaio ?? '',
    enderecoCompleto: draftData.enderecoCompleto ?? '',
    editorId: draftData.editorId ?? '',
    custoDeslocamento: draftData.custoDeslocamento ?? 0,
    repassarDeslocamento: draftData.repassarDeslocamento ?? true,
    autorizaUsoImagem: draftData.autorizaUsoImagem ?? false,
    indicadorId: draftData.indicadorId ?? '',
    observacoes: draftData.observacoes ?? '',
    data: restoredDate,
  } as WizardFormValues

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema) as any,
    defaultValues,
  })

  const { mutate: createAgendamento, isPending } = useCreateAgendamento()
  const { data: serverDraft, isLoading: isLoadingDraft } = useBuscarRascunho()
  const { mutate: salvarRascunho } = useSalvarRascunho()
  const { mutate: deletarRascunho } = useDeletarRascunho()
  const [isSaving, setIsSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveDraftToServer = useCallback(() => {
    const values = form.getValues()
    const hasData = values.nome || values.data
    if (!hasData) return

    setIsSaving(true)
    salvarRascunho(
      {
        clienteId: values.clienteId,
        nome: values.nome,
        telefone: values.telefone,
        email: values.email || '',
        cpf: values.cpf || '',
        cidade: values.cidade || '',
        estado: values.estado || '',
        origem: values.origem,
        pacoteId: values.pacoteId,
        data: values.data instanceof Date ? format(values.data, 'yyyy-MM-dd') : values.data,
        hora: values.hora,
        localEnsaio: values.localEnsaio,
        enderecoCompleto: values.enderecoCompleto || '',
        editorId: values.editorId,
        custoDeslocamento: values.custoDeslocamento,
        repassarDeslocamento: values.repassarDeslocamento,
        autorizaUsoImagem: values.autorizaUsoImagem,
        indicadorId: values.indicadorId,
        indicadorNome: values.indicadorNome,
        indicadorTelefone: values.indicadorTelefone,
        observacoes: values.observacoes || '',
        currentStep,
        comprovanteName: comprovante?.name ?? null,
        confirmado,
      } satisfies RascunhoAgendamentoData,
      {
        onSuccess: (result) => {
          const id = (result as any).id
          if (id) store.setRascunhoId(id)
          setIsSaving(false)
        },
        onError: () => setIsSaving(false),
      },
    )
  }, [form, salvarRascunho, currentStep, comprovante, confirmado, store])

  // Restore server draft if no localStorage draft
  useEffect(() => {
    if (hasDraft) return
    if (agendamentoCriadoRef.current) return
    if (!serverDraft || isLoadingDraft) return

    const restored: Record<string, unknown> = { ...serverDraft }
    if (typeof restored.data === 'string') {
      restored.data = new Date(restored.data.includes('T') ? restored.data : restored.data + 'T12:00:00')
    }
    delete restored.id
    delete restored.currentStep
    delete restored.comprovanteName
    delete restored.confirmado

    form.reset(restored as WizardFormValues)

    if (serverDraft.currentStep !== undefined) {
      setCurrentStepState(serverDraft.currentStep)
      store.setCurrentStep(serverDraft.currentStep)
    }
    if (serverDraft.comprovanteName) {
      store.setComprovanteName(serverDraft.comprovanteName)
    }
    if (serverDraft.confirmado !== undefined) {
      setConfirmadoState(serverDraft.confirmado)
      store.setConfirmado(serverDraft.confirmado)
    }
    if ((serverDraft as any).id) {
      store.setRascunhoId((serverDraft as any).id)
    }
  }, [serverDraft, isLoadingDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced auto-save to server
  useEffect(() => {
    if (Object.keys(useWizardStore.getState().formData).length === 0) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(saveDraftToServer, 5000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [useWizardStore((s) => s.formData)]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    if (fields.length > 0) {
      const isValid = await form.trigger(fields)
      if (!isValid) return
    }

    if (currentStep === 3 && !comprovante) {
      toast.error('Anexe o comprovante de entrada antes de continuar')
      return
    }

    saveDraftToServer()
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    saveDraftToServer()
    setCurrentStep(currentStep - 1)
  }

  const handleDiscard = () => {
    deletarRascunho(undefined, {
      onSuccess: () => {
        store.reset()
        setComprovanteState(undefined)
        setConfirmadoState(false)
        setCurrentStepState(0)
        form.reset()
        toast.success('Rascunho descartado')
        navigate(ROUTES.AGENDA)
      },
    })
  }

  const gerarResumoWhatsApp = useCallback(() => {
    const values = form.getValues()
    const texto = [
      '*RESUMO DO AGENDAMENTO*',
      '',
      `Cliente: ${values.nome}`,
      `Telefone: ${values.telefone}`,
      values.email ? `Email: ${values.email}` : '',
      '',
      `Data: ${values.data ? format(values.data, 'dd/MM/yyyy') : ''} às ${values.hora}`,
      `Local: ${values.localEnsaio}`,
      `Pacote: ${values.pacoteId}`,
      values.custoDeslocamento > 0
        ? `Deslocamento: R$ ${values.custoDeslocamento.toFixed(2)}${values.repassarDeslocamento ? ' (repassado)' : ' (absorvido)'}`
        : '',
      '',
      '*Status:* CONFIRMADO',
    ]
      .filter(Boolean)
      .join('\n')

    navigator.clipboard.writeText(texto)
    toast.success('Resumo copiado para a área de transferência!')
  }, [form])

  useEffect(() => {
    let isFirstCall = true

    const subscription = form.watch((values) => {
      if (isFirstCall) {
        isFirstCall = false
        return
      }

      const cleaned: Partial<WizardPersistedData> = {}
      const raw = values as Record<string, unknown>
      for (const key of Object.keys(raw)) {
        const val = raw[key]
        if (val !== undefined && val !== null) {
          if (typeof val === 'string' && val === '') continue
          ;(cleaned as Record<string, unknown>)[key] =
            key === 'data' && val instanceof Date ? format(val, 'yyyy-MM-dd') : val
        }
      }

      if (Object.keys(cleaned).length > 0) {
        store.setFormData(cleaned)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, store])

  const onSubmit = form.handleSubmit((data) => {
    if (!comprovante) {
      toast.error('Anexe o comprovante de entrada')
      return
    }
    if (!confirmado) {
      toast.error('Confirme que as informações estão corretas')
      return
    }

    createAgendamento(
      { data, comprovante },
      {
        onSuccess: (result) => {
          agendamentoCriadoRef.current = true
          setAgendamentoCriado(result.id)
          deletarRascunho(undefined)
          store.reset()
          toast.success('Agendamento criado com sucesso!')
        },
      },
    )
  })

  if (agendamentoCriado) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Agendamento Confirmado!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O agendamento foi registrado com sucesso no sistema.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={gerarResumoWhatsApp}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar Resumo WhatsApp
          </Button>
          <Button onClick={() => navigate(`/agenda/${agendamentoCriado}`)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Redirecionando em 3 segundos...
        </p>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <div className="rounded-lg border bg-card p-6">
          <StepIndicator currentStep={currentStep} />

          <div className="mt-8 mb-8">
            {currentStep === 0 && <StepCliente />}
            {currentStep === 1 && <StepEnsaio />}
            {currentStep === 2 && <StepIndicacao />}
            {currentStep === 3 && (
              <StepFinanceiro
                comprovante={comprovante}
                onComprovanteChange={setComprovante}
              />
            )}
            {currentStep === 4 && (
              <StepConfirmacao
                confirmado={confirmado}
                onConfirmadoChange={setConfirmado}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 0 ? () => navigate(ROUTES.AGENDA) : handleBack}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {currentStep === 0 ? 'Cancelar' : 'Voltar'}
              </Button>

              {Object.keys(useWizardStore.getState().formData).length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscard}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Descartar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground">Salvando...</span>
              )}
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Agendamento
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
