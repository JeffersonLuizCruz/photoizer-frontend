import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, FileSignature, Loader2 } from 'lucide-react'
import { PageLoading } from '@/shared/components/layout/Loading'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { FileUpload } from '@/shared/components/layout/FileUpload'
import { formatCurrency } from '@/shared/lib/format'
import { CONTRATO_STATUS } from '@/shared/constants'
import { assinarContratoSchema, type AssinarContratoFormValues, formatCpf } from '../schemas/contrato.schema'
import { useContratoPublico, useAssinarContrato } from '../api/queries'
import { STATUS_LABEL } from './status'
import { cn } from '@/shared/lib/cn'

export function ContratoPublicoPage() {
  const { token } = useParams<{ token: string }>()
  const { data: contrato, isLoading, error } = useContratoPublico(token!)
  const assinar = useAssinarContrato(token!)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [assinado, setAssinado] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssinarContratoFormValues>({
    resolver: zodResolver(assinarContratoSchema),
    mode: 'onSubmit',
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      cidade: '',
      estado: '',
      autorizaUsoImagem: undefined,
      assinatura: '',
    },
  })


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <PageLoading label="Carregando contrato..." />
      </div>
    )
  }

  if (error) {
    const msg = (error as any)?.response?.data?.message || error?.message || 'Erro ao carregar o contrato'
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <FileSignature className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold">Contrato não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Entre em contato com o fotógrafo para solicitar um novo link.
          </p>
        </div>
      </div>
    )
  }

  if (!contrato) return null

  const jahAssinado =
    contrato.status === CONTRATO_STATUS.ASSINADO_PELO_CLIENTE ||
    contrato.status === CONTRATO_STATUS.PAGAMENTO_CONFIRMADO ||
    contrato.status === CONTRATO_STATUS.APROVADO

  if (jahAssinado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-xl font-bold">Contrato já assinado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Status: {STATUS_LABEL[contrato.status]}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Seu contrato já foi recebido e está sendo processado.
          </p>
        </div>
      </div>
    )
  }

  const podeAssinar = contrato.podeAssinar

  if (assinado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-xl font-bold">Contrato assinado com sucesso!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu contrato foi enviado para {contrato.contratadaNome}.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Aguarde a confirmação do pagamento e a aprovação do agendamento.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Você pode fechar esta página.</p>
        </div>
      </div>
    )
  }

  const onSubmit = async (valores: AssinarContratoFormValues) => {
    setErroEnvio(null)
    if (!comprovante) {
      setErroEnvio('Anexe o comprovante de pagamento da reserva antes de assinar.')
      return
    }
    try {
      await assinar.mutateAsync({ valores, comprovante })
      setAssinado(true)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao assinar contrato. Tente novamente.'
      setErroEnvio(msg)
    }
  }

  const dataHora = new Date(contrato.dataHoraEnsaio)
  const dataFormatada = dataHora.toLocaleDateString('pt-BR')
  const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-3xl px-3 sm:px-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-10">
          <h1 className="mb-6 text-center text-lg font-bold sm:text-xl">
            PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS
          </h1>

          {erroEnvio && (
            <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {erroEnvio}
            </div>
          )}

          {contrato.motivoDevolucao && (
            <div className="mb-6 rounded-md bg-orange-50 p-3 text-sm text-orange-800 border border-orange-200">
              <p className="font-medium">Motivo da devolução:</p>
              <p className="mt-1">{contrato.motivoDevolucao}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Section title="1. Dados do Cliente">
              {podeAssinar ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input id="nome" {...register('nome')} placeholder="Como consta no RG" />
                    {errors.nome && <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
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
                        {...register('cpf')}
                        placeholder="000.000.000-00"
                        onChange={(e) => {
                          const formatted = formatCpf(e.target.value)
                          e.target.value = formatted
                          register('cpf').onChange(e)
                        }}
                        autoComplete="off"
                      />
                      {errors.cpf && <p className="mt-1 text-xs text-destructive">{errors.cpf.message}</p>}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" autoComplete="email" />
                      {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input id="cidade" {...register('cidade')} placeholder="Sua cidade" />
                      </div>
                      <div>
                        <Label htmlFor="estado">Estado</Label>
                        <Input id="estado" {...register('estado')} placeholder="SP" maxLength={2} className="uppercase" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <p>Nome completo: _______________________________</p>
                  <p>CPF: _______________________________________</p>
                  <p>E-mail: _____________________________________</p>
                  <p>Telefone: ____________________________________</p>
                  <p>Cidade / Estado: _____________________________</p>
                </div>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                Contratada: {contrato.contratadaNome}, inscrita no CNPJ nº {contrato.contratadaCnpj},
                com sede em {contrato.contratadaCidade}.
              </p>
            </Section>

            <Section title="2. Informações do Ensaio">
              <p>Data do ensaio: {dataFormatada}</p>
              <p>Horário do ensaio: {horaFormatada}</p>
              <p>Local do ensaio: {contrato.localEnsaio}</p>
              {contrato.enderecoCompleto && <p>Endereço completo: {contrato.enderecoCompleto}</p>}
            </Section>

            <Section title="3. Pacote Contratado">
              <p>Pacote: {contrato.pacoteNome}</p>
              <p className="text-sm text-muted-foreground">Inclui: serviço conforme pacote contratado.</p>
            </Section>

            <Section title="4. Valores">
              <p>Valor total do serviço: {formatCurrency(contrato.valorTotal)}</p>
              <p>
                Valor pago como reserva ({contrato.percentualEntrada}%):{' '}
                <strong>{formatCurrency(contrato.valorEntradaExigido)}</strong>
              </p>
              <p>Valor restante a pagar no final do ensaio: {formatCurrency(contrato.valorRestante)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                O pagamento da reserva garante o bloqueio da data e horário na agenda da Contratada.
                O valor restante deverá ser pago ao final da realização do ensaio fotográfico.
              </p>
            </Section>

            <Section title="Dados para pagamento (PIX)">
              <p className={cn('text-sm', contrato.pixChave ? 'text-blue-700' : 'text-muted-foreground')}>
                Chave PIX ({contrato.pixTipoChave}):{' '}
                <strong>{contrato.pixChave || 'Não informada (consulte o fotógrafo)'}</strong>
              </p>
            </Section>

            <Section title="5. Entrega das Fotografias">
              <p>As fotos do ensaio serão enviadas ao Cliente em até 2 dias após a realização do ensaio para que ele faça a seleção das imagens desejadas.</p>
              <p>Após a seleção, a entrega final das fotografias ocorrerá em até 2 dias.</p>
              <p>As fotos serão entregues em formato digital, em alta resolução.</p>
              <p>Caso o Cliente opte por fotos extras além do pacote contratado, será cobrado o valor de {formatCurrency(contrato.precoFotoExtra)} por foto adicional.</p>
            </Section>

            <Section title="6. Cancelamento">
              <p>Caso o Cliente cancele o ensaio por qualquer motivo, o valor pago como reserva não será reembolsado, pois garante a reserva da data na agenda da Contratada.</p>
              <p>Caso ocorra algum imprevisto que impeça a presença da Contratada, poderá haver a substituição por outro fotógrafo profissional de padrão equivalente.</p>
              <p>Caso não seja possível a substituição, o valor pago será devolvido integralmente ao Cliente.</p>
              <p>Se houver algum imprevisto relacionado à antecipação de voo, chuva ou doença, o ensaio será cancelado e haverá o reembolso completo do valor da reserva.</p>
            </Section>

            <Section title="7. USO DE IMAGEM (OPCIONAL)">
              {podeAssinar ? (
                <div className="space-y-3">
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      value="true"
                      {...register('autorizaUsoImagem')}
                      className="h-5 w-5 shrink-0 accent-primary"
                    />
                    <span className="font-medium">AUTORIZO</span>
                  </label>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      value="false"
                      {...register('autorizaUsoImagem')}
                      className="h-5 w-5 shrink-0 accent-primary"
                    />
                    <span className="font-medium">NÃO AUTORIZO</span>
                  </label>
                  {errors.autorizaUsoImagem && (
                    <p className="text-xs text-destructive">{errors.autorizaUsoImagem.message}</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ao autorizar, as imagens poderão ser utilizadas para fins profissionais e promocionais da
                    Contratada (redes sociais, portfólio, website, materiais publicitários).
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Responda na seção de assinatura abaixo.</p>
              )}
            </Section>

            <Section title="8. Disposições Gerais">
              <p>Este contrato passa a vigorar a partir da assinatura das partes.</p>
              <p>Qualquer alteração neste contrato deverá ser realizada por escrito.</p>
            </Section>

            {podeAssinar && (
              <Section title="9. Assinatura Digital">
                <p className="text-sm text-muted-foreground">
                  Preencha seus dados acima e assine digitalmente para confirmar a leitura e concordância com
                  todos os termos do contrato.
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="assinatura">Assinatura (digite seu nome completo) *</Label>
                    <Input
                      id="assinatura"
                      {...register('assinatura')}
                      placeholder="Digite seu nome completo para assinar"
                      autoComplete="off"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ao digitar seu nome, você declara que leu e concorda com todos os termos do contrato.
                    </p>
                    {errors.assinatura && <p className="mt-1 text-xs text-destructive">{errors.assinatura.message}</p>}
                  </div>

                  <div>
                    <Label>Comprovante de pagamento da reserva *</Label>
                    <p className="mt-1 mb-3 text-sm">
                      Transfira o valor de{' '}
                      <strong className="text-blue-700">{formatCurrency(contrato.valorEntradaExigido)}</strong>{' '}
                      via PIX para{' '}
                      <strong className="text-blue-700">
                        {contrato.pixChave || '(chave não informada)'}
                      </strong>{' '}
                      e anexe o comprovante abaixo.
                    </p>
                    <FileUpload
                      accept="image/jpeg,image/png,application/pdf"
                      maxSize={10 * 1024 * 1024}
                      onFilesChange={(files) => setComprovante(files[0] || null)}
                      label="Toque para anexar o comprovante (JPG, PNG ou PDF)"
                    />
                    {!comprovante && erroEnvio && (
                      <p className="mt-1 text-xs text-destructive">Anexe o comprovante de pagamento.</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-6 w-full sm:w-auto min-h-[48px] sm:min-h-[40px]"
                  disabled={assinar.isPending}
                >
                  {assinar.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileSignature className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                      Assinar e enviar contrato
                    </>
                  )}
                </Button>
              </Section>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  )
}