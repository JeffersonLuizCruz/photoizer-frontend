import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera, ChevronRight, Download, Check, Loader2, ShoppingBag, ArrowLeft, User, Mail, Phone, Waves, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import { BeachBackdrop } from '@/shared/components/beach/BeachBackdrop'
import { BEACH_CARD, BEACH_CTA } from '@/shared/components/beach/beach'
import { cn } from '@/shared/lib/cn'
import type { PacoteResponse } from '@/features/pacotes/types/pacotes.types'
import type { LeadPacoteRequest, OpcaoEntrega } from '../types/ecommerce.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// RF010: fluxo de solicitação em etapas. O envio é um lead comercial, não um
// pagamento: o estúdio entra em contato para fechar o pacote.
const STEPS = ['Revisão', 'Dados', 'Entrega', 'Pagamento', 'Confirmação']

export function CheckoutPage() {
  const { pacoteId } = useParams<{ pacoteId: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [pacote, setPacote] = useState<PacoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacao, setObservacao] = useState('')

  const [opcaoEntrega, setOpcaoEntrega] = useState<OpcaoEntrega>('DIGITAL')
  const entregaPrecos: Record<OpcaoEntrega, number> = { DIGITAL: 0, FISICA: 29.90, AMBAS: 49.90 }
  const entregaPrazos: Record<OpcaoEntrega, string> = {
    DIGITAL: 'Imediato após confirmação',
    FISICA: '7 a 10 dias úteis',
    AMBAS: 'Download imediato + mídia em 7-10 dias',
  }

  const [formaPagamento, setFormaPagamento] = useState<LeadPacoteRequest['formaPagamento']>('PIX')
  const [quantidadeExtras, setQuantidadeExtras] = useState(0)
  const precoFotoExtra = (pacote?.precoFotoExtra ?? 0) > 0 ? (pacote?.precoFotoExtra ?? 0) : 15
  const valorExtras = precoFotoExtra * quantidadeExtras
  const taxaEntrega = entregaPrecos[opcaoEntrega]
  const estimativa = Math.max(0, (pacote?.valorBase ?? 0) + valorExtras + taxaEntrega)

  useEffect(() => {
    if (!pacoteId) return
    ecommerceService.buscarPacote(pacoteId)
      .then(setPacote)
      .catch(() => toast.error('Pacote não encontrado'))
      .finally(() => setIsLoading(false))
  }, [pacoteId])

  const handleConfirmarDados = () => {
    if (!nome.trim() || !telefone.trim()) {
      toast.error('Informe seu nome e telefone para o estúdio entrar em contato.')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Informe um e-mail válido.')
      return
    }
    setStep(2)
  }

  const handleFinalizar = async () => {
    if (!pacote) return
    setIsSubmitting(true)
    try {
      await ecommerceService.criarLead({
        pacoteId: pacote.id,
        nome: nome.trim(),
        email: email.trim() || undefined,
        telefone: telefone.trim(),
        opcaoEntrega,
        formaPagamento,
        quantidadeExtras,
        observacao: observacao.trim() || undefined,
      })
      setStep(4)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Não foi possível enviar sua solicitação')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center">
        <BeachBackdrop />
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (!pacote) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center">
        <BeachBackdrop />
        <div className="text-center">
          <Camera className="mx-auto mb-3 h-12 w-12 text-cyan-400" />
          <h1 className="font-display text-lg font-semibold text-cyan-950">Pacote não encontrado</h1>
          <button onClick={() => navigate('/pacotes-disponiveis')}
            className="mt-4 text-sm font-medium text-cyan-700 hover:underline">
            Ver pacotes disponíveis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh">
      <BeachBackdrop />

      <header className="sticky top-0 z-40 border-b border-cyan-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <button onClick={() => step === 0 ? navigate('/pacotes-disponiveis') : setStep(Math.max(0, step - 1))}
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-cyan-800 hover:bg-cyan-100">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold text-cyan-950">
            <Waves className="h-4 w-4 text-cyan-500" />
            Solicitar Pacote
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-4 pt-6">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors',
                i < step ? 'bg-teal-500 text-white'
                  : i === step ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-300'
                  : 'bg-white text-slate-400 ring-1 ring-cyan-100',
              )}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('ml-1.5 hidden text-[10px] sm:inline', i <= step ? 'font-medium text-cyan-900' : 'text-slate-400')}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-2 h-0.5 flex-1 rounded-full', i < step ? 'bg-teal-400' : 'bg-cyan-100')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12">
        {step === 0 && (
          <div className="space-y-4">
            <div className={cn('p-5', BEACH_CARD)}>
              <h2 className="mb-3 font-display text-base font-semibold text-cyan-950">Pacote Selecionado</h2>
              <div className="flex items-start gap-3">
                {pacote.imagemCapa && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-cyan-100">
                    <img src={pacote.imagemCapa} alt={pacote.nome} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{pacote.nome}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{pacote.quantidadeFotos} fotos inclusas</p>
                </div>
                <span className="text-sm font-semibold text-cyan-900">{formatCurrency(pacote.valorBase)}</span>
              </div>
            </div>

            {pacote.precoFotoExtra != null && (
              <div className={cn('space-y-3 p-5', BEACH_CARD)}>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-cyan-950">Fotos Extras (interesse)</h2>
                  {quantidadeExtras > 0 && (
                    <button onClick={() => setQuantidadeExtras(0)}
                      className="text-xs text-slate-500 transition-colors hover:text-cyan-700">
                      Remover
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {formatCurrency(precoFotoExtra)} por foto extra. O estúdio confirmará a quantidade depois.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-cyan-100 bg-white">
                    <button onClick={() => setQuantidadeExtras(Math.max(0, quantidadeExtras - 1))}
                      disabled={quantidadeExtras === 0}
                      className="flex h-9 w-9 items-center justify-center text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-50 disabled:opacity-30">
                      –
                    </button>
                    <span className="w-12 text-center text-sm font-medium tabular-nums text-slate-800">{quantidadeExtras}</span>
                    <button onClick={() => setQuantidadeExtras(quantidadeExtras + 1)}
                      className="flex h-9 w-9 items-center justify-center text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-50">
                      +
                    </button>
                  </div>
                  {quantidadeExtras > 0 && (
                    <span className="text-xs font-medium text-cyan-700">
                      +{formatCurrency(valorExtras)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className={cn('space-y-2 p-5', BEACH_CARD)}>
              <h2 className="mb-1 font-display text-base font-semibold text-cyan-950">Estimativa</h2>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pacote ({pacote.nome})</span>
                <span className="text-slate-800">{formatCurrency(pacote.valorBase)}</span>
              </div>
              {quantidadeExtras > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fotos extras ({quantidadeExtras} × {formatCurrency(precoFotoExtra)})</span>
                  <span className="text-slate-800">{formatCurrency(valorExtras)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Taxa de entrega</span>
                <span className="text-slate-800">{taxaEntrega === 0 ? 'Grátis' : formatCurrency(taxaEntrega)}</span>
              </div>
              <div className="flex justify-between border-t border-cyan-100 pt-2 text-sm font-semibold text-cyan-950">
                <span>Total estimado</span>
                <span>{formatCurrency(estimativa)}</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">
                A solicitação não cobra nada agora. O estúdio entrará em contato para confirmar
                disponibilidade, valores e pagamento.
              </p>
            </div>

            <button onClick={() => setStep(1)}
              className={cn('flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold', BEACH_CTA)}>
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-cyan-950">Seus Dados</h2>
            <div className={cn('space-y-3 p-5', BEACH_CARD)}>
              <p className="text-xs text-slate-500">
                Precisamos do seu nome, telefone e (opcionalmente) e-mail para o estúdio entrar em contato.
              </p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo"
                  className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com (opcional)"
                  className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                <input type="tel" inputMode="tel" autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-8888"
                  className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
              </div>
              <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3}
                maxLength={2000}
                placeholder="Alguma preferência ou observação? (opcional)"
                className="w-full resize-none rounded-xl border border-cyan-100 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
            </div>

            <button onClick={handleConfirmarDados}
              className={cn('flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold', BEACH_CTA)}>
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-cyan-950">Opção de Entrega</h2>
            <div className="space-y-2">
              {(['DIGITAL', 'FISICA', 'AMBAS'] as OpcaoEntrega[]).map((opcao) => {
                const preco = entregaPrecos[opcao]
                const selecionado = opcaoEntrega === opcao
                return (
                  <div key={opcao}
                    onClick={() => setOpcaoEntrega(opcao)}
                    role="radio"
                    aria-checked={selecionado}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpcaoEntrega(opcao) }}
                    className={cn(
                      'cursor-pointer rounded-2xl border bg-white p-4 transition-colors',
                      selecionado ? 'border-cyan-300 ring-2 ring-cyan-200' : 'border-cyan-100 hover:border-cyan-200',
                    )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Download className={cn('h-5 w-5', selecionado ? 'text-cyan-600' : 'text-slate-400')} />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {opcao === 'DIGITAL' ? 'Download Digital' : opcao === 'FISICA' ? 'Mídia Física' : 'Ambos'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {opcao === 'DIGITAL' ? 'Links de download por e-mail' :
                             opcao === 'FISICA' ? 'USB ou DVD entregue em casa' :
                             'Download + mídia física'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">Prazo: {entregaPrazos[opcao]}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-cyan-900">{preco === 0 ? 'Grátis' : formatCurrency(preco)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => setStep(3)}
              className={cn('flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold', BEACH_CTA)}>
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold text-cyan-950">Pagamento de Interesse</h2>
            <div className={cn('space-y-2 p-4', BEACH_CARD)}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Forma de pagamento</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['PIX', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'PAYPAL'] as const).map((metodo) => (
                  <button key={metodo} onClick={() => setFormaPagamento(metodo)}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-center text-xs font-medium transition-colors',
                      formaPagamento === metodo
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                        : 'border-cyan-100 hover:bg-cyan-50/50',
                    )}>
                    {metodo === 'PIX' ? 'PIX' : metodo === 'CARTAO_CREDITO' ? 'Cartão' : metodo === 'TRANSFERENCIA' ? 'Transferência' : 'PayPal'}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn('space-y-1.5 p-4', BEACH_CARD)}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total estimado</span>
                <span className="text-slate-800">{formatCurrency(estimativa)}</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">
                Nenhum valor será cobrado nesta etapa. A confirmação e o pagamento são combinados
                diretamente com o estúdio.
              </p>
            </div>

            <button onClick={() => void handleFinalizar()} disabled={isSubmitting}
              className={cn('flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold disabled:opacity-50', BEACH_CTA)}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="py-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 shadow-lg shadow-cyan-200">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-cyan-950">Solicitação enviada!</h1>
            <p className="mx-auto mb-6 max-w-sm text-sm text-slate-600">
              Recebemos seu interesse no pacote <strong>{pacote.nome}</strong>. O estúdio entrará em
              contato pelo telefone informado para confirmar os detalhes.
            </p>
            <div className={cn('mx-auto mb-6 max-w-xs p-4', BEACH_CARD)}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-500">Pacote</span>
                <span className="font-medium text-slate-800">{pacote.nome}</span>
              </div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-500">Fotos extras</span>
                <span className="font-medium text-slate-800">{quantidadeExtras}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total estimado</span>
                <span className="font-semibold text-cyan-900">{formatCurrency(estimativa)}</span>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('/')}
                className={cn('flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold', BEACH_CTA)}>
                <ShoppingBag className="h-4 w-4" /> Ir para o Início
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
