import { useState, useCallback } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Loader2, Copy, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants'
import { wizardFormSchema, type WizardFormValues } from '../schemas/agendamento.schema'
import { useCreateAgendamento } from '../api/queries'
import { StepCliente } from './StepCliente'
import { StepEnsaio } from './StepEnsaio'
import { StepFinanceiro } from './StepFinanceiro'
import { StepConfirmacao } from './StepConfirmacao'

const STEPS = [
  { label: 'Cliente', component: StepCliente },
  { label: 'Ensaio', component: StepEnsaio },
  { label: 'Financeiro', component: StepFinanceiro },
  { label: 'Confirmação', component: StepConfirmacao },
] as const

const STEP_FIELDS: Record<number, (keyof WizardFormValues)[]> = {
  0: ['nome', 'telefone'],
  1: ['pacoteId', 'data', 'hora', 'localEnsaio'],
  2: [],
  3: [],
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'text-sm hidden sm:inline',
                index <= currentStep ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                'mx-2 sm:mx-4 h-px w-8 sm:w-16 transition-colors',
                index < currentStep ? 'bg-primary' : 'bg-muted',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

interface NovoAgendamentoWizardProps {
  dataInicial?: Date
}

export function NovoAgendamentoWizard({ dataInicial }: NovoAgendamentoWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [comprovante, setComprovante] = useState<File | undefined>()
  const [confirmado, setConfirmado] = useState(false)
  const [agendamentoCriado, setAgendamentoCriado] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema) as any,
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      cidade: '',
      estado: '',
      pacoteId: '',
      data: dataInicial,
      hora: '',
      localEnsaio: '',
      enderecoCompleto: '',
      editorId: '',
      taxaDeslocamento: 0,
      autorizaUsoImagem: false,
      observacoes: '',
    },
  })

  const { mutate: createAgendamento, isPending } = useCreateAgendamento()

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    if (fields.length > 0) {
      const isValid = await form.trigger(fields)
      if (!isValid) return
    }

    if (currentStep === 2 && !comprovante) {
      toast.error('Anexe o comprovante de entrada antes de continuar')
      return
    }

    setCurrentStep((s) => s + 1)
  }

  const handleBack = () => {
    setCurrentStep((s) => s - 1)
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
      values.taxaDeslocamento > 0 ? `Taxa de Deslocamento: R$ ${values.taxaDeslocamento.toFixed(2)}` : '',
      '',
      '*Status:* CONFIRMADO',
    ]
      .filter(Boolean)
      .join('\n')

    navigator.clipboard.writeText(texto)
    toast.success('Resumo copiado para a área de transferência!')
  }, [form])

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
          setAgendamentoCriado(result.id)
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
            {currentStep === 2 && (
              <StepFinanceiro
                comprovante={comprovante}
                onComprovanteChange={setComprovante}
              />
            )}
            {currentStep === 3 && (
              <StepConfirmacao
                confirmado={confirmado}
                onConfirmadoChange={setConfirmado}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? () => navigate(ROUTES.AGENDA) : handleBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStep === 0 ? 'Cancelar' : 'Voltar'}
            </Button>

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
      </form>
    </FormProvider>
  )
}
