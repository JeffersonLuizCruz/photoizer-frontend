import { useState, type ReactNode, type ComponentType } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2,
  FileSignature,
  Loader2,
  Palmtree,
  Sun,
  User,
  Camera,
  CameraOff,
  Receipt,
} from 'lucide-react'
import { PageLoading } from '@/shared/components/layout/Loading'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { FileUpload } from '@/shared/components/layout/FileUpload'
import { formatCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { AGENDAMENTO_STATUS } from '@/shared/constants'
import { assinarPropostaSchema, type AssinarPropostaFormValues, formatCpf } from '../schemas/proposta.schema'
import { usePropostaPublica, useAssinarProposta } from '../api/queries'
import { SignaturePad } from '../components/SignaturePad'
import { BeachBackdrop } from '@/shared/components/beach/BeachBackdrop'
import { ProposalSummary } from '../components/ProposalSummary'
import { ContractDocument } from '../components/ContractDocument'

interface FormSectionProps {
  step: number
  title: string
  description?: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}

function FormSection({ step, title, description, icon: Icon, children }: FormSectionProps) {
  return (
    <section className="rounded-3xl bg-white/95 p-5 shadow-sm ring-1 ring-cyan-100 backdrop-blur sm:p-7">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 text-white shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-cyan-950">
            {step}. {title}
          </h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function StatusScreen({
  icon: Icon,
  iconClass,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  iconClass: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <BeachBackdrop />
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-sm ring-1 ring-cyan-100 backdrop-blur">
        <Icon className={cn('mx-auto h-16 w-16', iconClass)} />
        <h1 className="mt-4 font-display text-xl font-bold text-cyan-950">{title}</h1>
        <div className="mt-2 space-y-1 text-sm text-slate-500">{children}</div>
      </div>
    </div>
  )
}

export function PropostaPublicaPage() {
  const { token } = useParams<{ token: string }>()
  const { data: proposta, isLoading, error } = usePropostaPublica(token!)
  const assinar = useAssinarProposta(token!)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [assinaturaImagem, setAssinaturaImagem] = useState<Blob | null>(null)
  const [assinado, setAssinado] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<AssinarPropostaFormValues>({
    resolver: zodResolver(assinarPropostaSchema),
    mode: 'onSubmit',
    defaultValues: {
      nome: '', telefone: '', email: '', cpf: '', cidade: '', estado: '',
      autorizaUsoImagem: undefined, assinatura: '',
    },
  })

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <BeachBackdrop />
        <PageLoading label="Carregando proposta..." />
      </div>
    )
  }

  if (error) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || error?.message || 'Erro ao carregar a proposta'
    return (
      <StatusScreen icon={Palmtree} iconClass="text-cyan-500" title="Proposta não encontrada">
        <p>{msg}</p>
        <p className="text-xs">Entre em contato com o fotógrafo para solicitar um novo link.</p>
      </StatusScreen>
    )
  }

  if (!proposta) return null

  const jahAssinado = proposta.status !== AGENDAMENTO_STATUS.PRE_RESERVA

  if (jahAssinado) {
    return (
      <StatusScreen icon={Sun} iconClass="text-amber-400" title="Proposta já assinada">
        <p>Esta proposta já foi assinada. Você pode fechar esta página.</p>
      </StatusScreen>
    )
  }

  if (assinado) {
    return (
      <StatusScreen icon={CheckCircle2} iconClass="text-emerald-500" title="Proposta assinada com sucesso!">
        <p>Seu contrato foi enviado para {proposta.contratadaNome}.</p>
        <p>Aguarde a confirmação do pagamento e a aprovação do agendamento.</p>
        <p className="text-xs">Você pode fechar esta página.</p>
      </StatusScreen>
    )
  }

  const podeAssinar = proposta.podeAssinar

  const onSubmit = async (valores: AssinarPropostaFormValues) => {
    setErroEnvio(null)
    if (!comprovante) {
      setErroEnvio('Anexe o comprovante de pagamento da reserva antes de assinar.')
      return
    }
    if (!assinaturaImagem) {
      setErroEnvio('Desenhe sua assinatura antes de enviar.')
      return
    }
    try {
      await assinar.mutateAsync({ valores, comprovante, assinaturaImagem })
      setAssinado(true)
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (e as Error)?.message || 'Erro ao assinar proposta. Tente novamente.'
      setErroEnvio(msg)
    }
  }

  return (
    <div className="relative min-h-screen">
      <BeachBackdrop />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:py-10">
        <ProposalSummary proposta={proposta} />

        {erroEnvio && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{erroEnvio}</div>
        )}

        <ContractDocument html={proposta.clausulasHtml} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {podeAssinar && (
            <FormSection
              step={1}
              title="Seus dados"
              description="Preencha como consta nos seus documentos."
              icon={User}
            >
              <div>
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" className="mt-1 rounded-xl" {...register('nome')} placeholder="Como consta no RG" />
                {errors.nome && <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    className="mt-1 rounded-xl"
                    {...register('telefone')}
                    placeholder="(11) 99999-9999"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
                      let formatted = raw
                      if (raw.length > 2) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
                      if (raw.length > 7) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
                      e.target.value = formatted
                      register('telefone').onChange(e)
                    }}
                    autoComplete="tel"
                  />
                  {errors.telefone && <p className="mt-1 text-xs text-destructive">{errors.telefone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    className="mt-1 rounded-xl"
                    {...register('cpf')}
                    placeholder="000.000.000-00"
                    onChange={(e) => {
                      e.target.value = formatCpf(e.target.value)
                      register('cpf').onChange(e)
                    }}
                    autoComplete="off"
                  />
                  {errors.cpf && <p className="mt-1 text-xs text-destructive">{errors.cpf.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" className="mt-1 rounded-xl" {...register('email')} placeholder="email@exemplo.com" autoComplete="email" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" className="mt-1 rounded-xl" {...register('cidade')} placeholder="Sua cidade" />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" className="mt-1 rounded-xl uppercase" {...register('estado')} placeholder="SP" maxLength={2} />
                  </div>
                </div>
              </div>
            </FormSection>
          )}

          {podeAssinar && (
            <FormSection
              step={2}
              title="Uso de imagem"
              description="Escolha se autoriza o uso profissional das suas fotos."
              icon={Camera}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-input px-4 py-3 transition-colors has-[:checked]:border-cyan-400 has-[:checked]:bg-cyan-50">
                  <input type="radio" value="true" {...register('autorizaUsoImagem')} className="h-5 w-5 shrink-0 accent-cyan-600" />
                  <Camera className="h-5 w-5 text-cyan-600" />
                  <span className="font-medium text-slate-700">AUTORIZO</span>
                </label>
                <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-input px-4 py-3 transition-colors has-[:checked]:border-cyan-400 has-[:checked]:bg-cyan-50">
                  <input type="radio" value="false" {...register('autorizaUsoImagem')} className="h-5 w-5 shrink-0 accent-cyan-600" />
                  <CameraOff className="h-5 w-5 text-slate-500" />
                  <span className="font-medium text-slate-700">NÃO AUTORIZO</span>
                </label>
              </div>
              {errors.autorizaUsoImagem && <p className="text-xs text-destructive">{errors.autorizaUsoImagem.message}</p>}
              <p className="text-sm text-slate-500">
                Ao autorizar, as imagens poderão ser utilizadas para fins profissionais e promocionais da Contratada (redes sociais, portfólio, website, materiais publicitários).
              </p>
            </FormSection>
          )}

          {podeAssinar && (
            <FormSection
              step={3}
              title="Assinatura digital"
              description="Assine com o dedo ou o mouse e confirme digitando seu nome completo."
              icon={FileSignature}
            >
              <div>
                <Label>Assinatura (desenho) *</Label>
                <div className="mt-2 rounded-2xl border border-cyan-100 bg-white p-2">
                  <SignaturePad onChange={setAssinaturaImagem} />
                </div>
              </div>

              <div>
                <Label htmlFor="assinatura">Confirmação (digite seu nome completo) *</Label>
                <Input id="assinatura" className="mt-1 rounded-xl" {...register('assinatura')} placeholder="Digite seu nome completo para confirmar" autoComplete="off" />
                {errors.assinatura && <p className="mt-1 text-xs text-destructive">{errors.assinatura.message}</p>}
              </div>
            </FormSection>
          )}

          {podeAssinar && (
            <FormSection
              step={4}
              title="Comprovante da reserva"
              description="Anexe o comprovante do PIX da reserva para concluir."
              icon={Receipt}
            >
              <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-rose-50 p-4">
                <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <p className="text-sm text-orange-900">
                  Transfira <strong>{formatCurrency(proposta.valorEntradaExigido)}</strong> via PIX para{' '}
                  <strong>{proposta.pixChave || '(chave não informada)'}</strong> e anexe o comprovante abaixo.
                </p>
              </div>

              <FileUpload
                accept="image/jpeg,image/png,application/pdf"
                maxSize={10 * 1024 * 1024}
                onFilesChange={(files) => setComprovante(files[0] || null)}
                label="Toque para anexar o comprovante (JPG, PNG ou PDF)"
              />
              {!comprovante && erroEnvio && <p className="text-xs text-destructive">Anexe o comprovante de pagamento.</p>}
            </FormSection>
          )}

          {podeAssinar && (
            <Button
              type="submit"
              disabled={assinar.isPending}
              className="min-h-[52px] w-full rounded-2xl border-0 bg-gradient-to-r from-orange-400 to-rose-400 text-base font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:from-orange-500 hover:to-rose-500"
            >
              {assinar.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Enviando...</>
              ) : (
                <><FileSignature className="mr-2 h-5 w-5" />Assinar e enviar</>
              )}
            </Button>
          )}
        </form>

        <p className="pb-6 text-center text-xs text-slate-400">
          Documento gerado eletronicamente · {proposta.contratadaNome}
        </p>
      </main>
    </div>
  )
}
